/**
 * webrtcManager.js
 * Native WebRTC PeerConnection manager implementing the Perfect Negotiation pattern.
 * Transports real-time camera video and microphone audio peer-to-peer.
 */

export const getIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ];

  const env =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env
      : typeof process !== 'undefined' && process.env
      ? process.env
      : {};

  // Optional TURN relay support from environment variables
  const turnUrl = env.VITE_TURN_URL;
  const turnUsername = env.VITE_TURN_USERNAME;
  const turnCredential = env.VITE_TURN_CREDENTIAL;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: turnUsername || undefined,
      credential: turnCredential || undefined,
    });
  }

  return servers;
};

/**
 * Requests camera and microphone streams from the browser.
 */
export async function acquireLocalMedia({ video = true, audio = true } = {}) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('BROWSER_UNSUPPORTED_MEDIA');
  }

  return await navigator.mediaDevices.getUserMedia({
    video: video
      ? {
          width: { ideal: 640, max: 640 },
          height: { ideal: 480, max: 480 },
          frameRate: { ideal: 24, max: 25 },
          facingMode: 'user',
        }
      : false,
    audio: audio,
  });
}

/**
 * Applies sender bitrate encoding parameters (maxBitrate: 1200 kbps, maxFramerate: 25 fps, maintain-framerate).
 */
function applySenderBitrateLimit(pc, maxBitrate = 1200000) {
  try {
    const senders = pc.getSenders();
    const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
    if (videoSender && typeof videoSender.getParameters === 'function' && typeof videoSender.setParameters === 'function') {
      const params = videoSender.getParameters();
      params.degradationPreference = 'maintain-framerate';
      if (!params.encodings || params.encodings.length === 0) {
        params.encodings = [{}];
      }
      params.encodings[0].maxBitrate = maxBitrate;
      params.encodings[0].maxFramerate = 25;
      videoSender
        .setParameters(params)
        .then(() => {
          console.log(`[WebRTC Diagnostic] Video sender parameters set: maxBitrate=${maxBitrate} bps, maxFramerate=25 fps`);
        })
        .catch((err) => {
          console.log('[WebRTC Diagnostic] Sender parameters deferred or unsupported:', err?.message || err);
        });
    }
  } catch (err) {
    console.warn('[WebRTC Diagnostic] Error configuring sender parameters:', err);
  }
}

/**
 * Diagnostic logger to inspect active ICE candidate pair type (host, srflx, prflx, relay).
 */
async function logSelectedIceCandidatePair(pc) {
  try {
    const stats = await pc.getStats();
    stats.forEach((report) => {
      if (report.type === 'candidate-pair' && (report.state === 'succeeded' || report.selected)) {
        const local = stats.get(report.localCandidateId);
        const remote = stats.get(report.remoteCandidateId);
        console.log(`[WebRTC Diagnostic] Selected ICE Candidate Pair:
  - Local: type=${local?.candidateType || local?.type}, protocol=${local?.protocol}, ip=${local?.ip || local?.address}, port=${local?.port}
  - Remote: type=${remote?.candidateType || remote?.type}, protocol=${remote?.protocol}, ip=${remote?.ip || remote?.address}, port=${remote?.port}`);
      }
    });
  } catch (err) {
    // Stats query failed or not ready
  }
}

/**
 * Creates and manages an RTCPeerConnection for a two-person session.
 */
export function createPeerSession({
  localSessionId,
  remoteSessionId,
  isInitiator = false,
  localStream,
  sendSignal,
  onRemoteStream,
  onConnectionStateChange,
  onRemoteMediaState,
}) {
  const pc = new RTCPeerConnection({
    iceServers: getIceServers(),
  });

  // W3C Perfect Negotiation: deterministic polite role assignment
  const isPolite = localSessionId > remoteSessionId;
  console.log('[WebRTC DEBUG] Peer session initialized', {
    localSessionId,
    remoteSessionId,
    isInitiator,
    isPolite,
  });
  console.log(`[WebRTC DEBUG] Initial initiator = ${isInitiator}`);

  let makingOffer = false;
  let ignoreOffer = false;
  let isSettingRemoteAnswerPending = false;
  let isClosed = false;
  let isInitialNegotiation = true;
  const pendingIceCandidates = [];

  const remoteStream = new MediaStream();

  // 1. Add local media tracks to the connection
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
    applySenderBitrateLimit(pc);
  }

  // 2. Perfect Negotiation: onnegotiationneeded
  pc.onnegotiationneeded = async () => {
    if (isClosed) return;

    // FIX 2: Deterministic initial offerer. If this is the initial connection
    // and we are NOT the designated initiator, do not create an offer. Wait for the initiator's offer.
    if (isInitialNegotiation && !isInitiator) {
      console.log('[WebRTC DEBUG] Initial initiator = false. Responder waiting for initial OFFER from initiator');
      return;
    }

    try {
      makingOffer = true;
      isInitialNegotiation = false;
      console.log('[WebRTC DEBUG] Sending OFFER');
      await pc.setLocalDescription();
      applySenderBitrateLimit(pc);
      await sendSignal({
        type: 'offer',
        targetId: remoteSessionId,
        sdp: {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp,
        },
      });
    } catch (err) {
      console.error('[WebRTC] Error during negotiation:', err);
    } finally {
      makingOffer = false;
    }
  };

  // 3. ICE Candidate gathering and transmission
  pc.onicecandidate = async ({ candidate }) => {
    if (isClosed || !candidate) return;
    try {
      console.log('[WebRTC DEBUG] Sending ICE candidate');
      await sendSignal({
        type: 'ice-candidate',
        targetId: remoteSessionId,
        candidate: candidate.toJSON ? candidate.toJSON() : candidate,
      });
    } catch (err) {
      console.error('[WebRTC] Error sending ICE candidate:', err);
    }
  };

  // 4. Remote track received
  pc.ontrack = (event) => {
    if (isClosed) return;
    console.log(`[WebRTC DEBUG] Remote track received: ${event.track.kind}`);
    
    if (event.streams && event.streams[0]) {
      if (typeof onRemoteStream === 'function') {
        onRemoteStream(event.streams[0]);
      }
    } else {
      remoteStream.addTrack(event.track);
      if (typeof onRemoteStream === 'function') {
        onRemoteStream(remoteStream);
      }
    }
  };

  // 5. Connection state monitoring
  pc.onconnectionstatechange = () => {
    if (isClosed) return;
    const state = pc.connectionState;
    console.log(`[WebRTC DEBUG] Connection state: ${state}`);
    if (state === 'connected') {
      logSelectedIceCandidatePair(pc);
    }
    if (typeof onConnectionStateChange === 'function') {
      onConnectionStateChange(state);
    }
  };

  pc.oniceconnectionstatechange = () => {
    if (isClosed) return;
    console.log(`[WebRTC Diagnostic] iceConnectionState changed: ${pc.iceConnectionState}`);
    if (pc.iceConnectionState === 'connected') {
      logSelectedIceCandidatePair(pc);
    }
  };

  pc.onsignalingstatechange = () => {
    if (isClosed) return;
    console.log(`[WebRTC Diagnostic] signalingState changed: ${pc.signalingState}`);
  };

  // 6. Incoming signal dispatcher
  const handleSignal = async (signal) => {
    if (isClosed || !signal) return;

    try {
      if (signal.type === 'offer') {
        console.log('[WebRTC DEBUG] Received OFFER');
        const readyForOffer =
          !makingOffer &&
          (pc.signalingState === 'stable' || isSettingRemoteAnswerPending);
        const offerCollision = !readyForOffer;

        ignoreOffer = !isPolite && offerCollision;
        if (ignoreOffer) {
          console.log('[WebRTC] Glare collision detected -> ignoring offer (impolite peer)');
          return;
        }

        console.log('[WebRTC DEBUG] Setting remote OFFER');
        const sdpInit = signal.sdp && signal.sdp.sdp ? signal.sdp : signal;
        await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));
        isInitialNegotiation = false;

        // Flush queued ICE candidates
        while (pendingIceCandidates.length > 0) {
          const cand = pendingIceCandidates.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (_) {}
        }

        console.log('[WebRTC DEBUG] Creating ANSWER');
        await pc.setLocalDescription();
        applySenderBitrateLimit(pc);
        console.log('[WebRTC DEBUG] Sending ANSWER');
        await sendSignal({
          type: 'answer',
          targetId: remoteSessionId,
          sdp: {
            type: pc.localDescription.type,
            sdp: pc.localDescription.sdp,
          },
        });
      } else if (signal.type === 'answer') {
        console.log('[WebRTC DEBUG] Received ANSWER');
        console.log('[WebRTC DEBUG] Setting remote ANSWER');
        isSettingRemoteAnswerPending = true;
        const sdpInit = signal.sdp && signal.sdp.sdp ? signal.sdp : signal;
        await pc.setRemoteDescription(new RTCSessionDescription(sdpInit));
        isSettingRemoteAnswerPending = false;
        isInitialNegotiation = false;
        applySenderBitrateLimit(pc);

        // Flush queued ICE candidates
        while (pendingIceCandidates.length > 0) {
          const cand = pendingIceCandidates.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (_) {}
        }
      } else if (signal.type === 'ice-candidate') {
        console.log('[WebRTC DEBUG] Received ICE candidate');
        if (!pc.remoteDescription) {
          pendingIceCandidates.push(signal.candidate);
        } else {
          try {
            if (signal.candidate) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          } catch (candidateErr) {
            if (!ignoreOffer) {
              console.warn('[WebRTC] Error adding ICE candidate:', candidateErr);
            }
          }
        }
      } else if (signal.type === 'media-state') {
        if (typeof onRemoteMediaState === 'function') {
          onRemoteMediaState(signal.state);
        }
      }
    } catch (err) {
      console.error('[WebRTC] Error processing incoming signal:', err);
    }
  };

  const setCameraEnabled = (enabled) => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
      sendSignal({
        type: 'media-state',
        targetId: remoteSessionId,
        state: { cameraOn: enabled },
      }).catch(() => {});
    }
  };

  const setMicEnabled = (enabled) => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      sendSignal({
        type: 'media-state',
        targetId: remoteSessionId,
        state: { micOn: enabled },
      }).catch(() => {});
    }
  };

  const close = () => {
    isClosed = true;
    console.log('[WebRTC] Closing peer connection session');
    try {
      pc.close();
    } catch (_) {}
  };

  return {
    handleSignal,
    setCameraEnabled,
    setMicEnabled,
    close,
    getPeerConnection: () => pc,
  };
}

export default {
  acquireLocalMedia,
  createPeerSession,
  getIceServers,
};
