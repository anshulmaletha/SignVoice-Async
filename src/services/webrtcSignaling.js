/**
 * webrtcSignaling.js
 * Signaling and presence channel for two-person WebRTC video calling.
 * Primary: Supabase Realtime (Broadcast + Presence) for real cross-device communication.
 * Fallback: Native BroadcastChannel for local development across multiple tabs.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';

export function createSignalingChannel({
  meetingId,
  localSessionId,
  onSignal,
  onPresenceChange,
  onRoomFull,
  onError,
}) {
  let isCleanedUp = false;

  if (isSupabaseConfigured()) {
    console.log(`[Signaling] Connecting to Supabase Realtime for room: ${meetingId}`);

    const channel = supabase.channel(`room:${meetingId}`, {
      config: {
        presence: {
          key: localSessionId,
        },
      },
    });

    let currentParticipants = new Set([localSessionId]);

    const handlePresenceSync = () => {
      if (isCleanedUp) return;
      const state = channel.presenceState();
      
      // Order participants chronologically by joinedAt, tie-break by key string comparison
      const sortedPresences = Object.entries(state)
        .map(([key, presences]) => ({
          key,
          joinedAt: (presences && presences[0] && presences[0].joinedAt) || 0,
        }))
        .sort((a, b) => {
          if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
          return a.key.localeCompare(b.key);
        });

      const activeTwo = sortedPresences.slice(0, 2).map((p) => p.key);

      // Check room full condition (more than 2 participants, and we are not among first 2)
      if (sortedPresences.length > 2 && !activeTwo.includes(localSessionId)) {
        console.warn('[Signaling] Room is full (max 2 participants).');
        if (typeof onRoomFull === 'function') onRoomFull();
        channel.unsubscribe();
        return;
      }

      const sessionIds = activeTwo;
      currentParticipants = new Set(sessionIds);
      const otherParticipants = sessionIds.filter((id) => id !== localSessionId);

      if (typeof onPresenceChange === 'function') {
        const isInitiator = activeTwo[0] === localSessionId;
        onPresenceChange({
          participants: sessionIds,
          otherParticipantId: otherParticipants[0] || null,
          count: sessionIds.length,
          state: sessionIds.length >= 2 ? 'connected' : 'waiting',
          isSupabase: true,
          isInitiator,
        });
      }
    };

    // 1. Presence Listeners
    channel
      .on('presence', { event: 'sync' }, handlePresenceSync)
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== localSessionId) {
          console.log(`[Signaling] Remote participant left: ${key}`);
          currentParticipants.delete(key);
          handlePresenceSync();
        }
      });

    // 2. Broadcast Signals (SDP Offers, Answers, ICE Candidates, Media States)
    channel.on('broadcast', { event: 'webrtc-signal' }, ({ payload }) => {
      console.log(`[Signaling Trace] Received broadcast: type=${payload?.type}, senderId=${payload?.senderId}, targetId=${payload?.targetId}, myId=${localSessionId}`);
      if (isCleanedUp || !payload || payload.senderId === localSessionId) {
        return;
      }
      if (payload.targetId && payload.targetId !== localSessionId) {
        console.log(`[Signaling Trace] Discarding signal intended for other target: ${payload.targetId}`);
        return;
      }
      if (typeof onSignal === 'function') {
        onSignal(payload.senderId, payload);
      }
    });

    // 3. Subscribe & Track Local Presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && !isCleanedUp) {
        console.log('[Signaling] Subscribed to Supabase channel, tracking presence...');
        await channel.track({
          sessionId: localSessionId,
          joinedAt: Date.now(),
        });
      } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !isCleanedUp) {
        console.warn(`[Signaling] Supabase Realtime channel error: ${status}`);
        if (typeof onError === 'function') {
          onError(status);
        }
      }
    });

    return {
      sendSignal: async (signalData) => {
        if (isCleanedUp) return;
        console.log(`[Signaling Trace] sendSignal: type=${signalData.type}, targetId=${signalData.targetId}, from=${localSessionId}`);
        await channel.send({
          type: 'broadcast',
          event: 'webrtc-signal',
          payload: {
            ...signalData,
            senderId: localSessionId,
            timestamp: Date.now(),
          },
        });
      },
      leave: async () => {
        isCleanedUp = true;
        try {
          await channel.untrack();
        } catch (_) {}
        supabase.removeChannel(channel);
        console.log('[Signaling] Left Supabase channel');
      },
      isCloud: true,
    };
  }

  // Fallback: Local BroadcastChannel for local development
  console.log(`[Signaling] Supabase not configured. Using local BroadcastChannel fallback for room: ${meetingId}`);

  const bc = new BroadcastChannel(`signvoice-webrtc-${meetingId}`);
  const localJoinedAt = Date.now();
  const knownParticipants = new Map(); // sessionId -> { joinedAt, lastSeen }
  knownParticipants.set(localSessionId, { joinedAt: localJoinedAt, lastSeen: Date.now() });

  let heartbeatInterval = null;

  const notifyPresence = () => {
    if (isCleanedUp) return;
    const now = Date.now();
    // Prune stale participants (> 6s without heartbeat)
    for (const [id, info] of knownParticipants.entries()) {
      if (id !== localSessionId && now - info.lastSeen > 6000) {
        knownParticipants.delete(id);
      }
    }

    // Sort by joinedAt, tie-break by id string comparison
    const sorted = Array.from(knownParticipants.entries())
      .map(([id, info]) => ({ id, joinedAt: info.joinedAt }))
      .sort((a, b) => {
        if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
        return a.id.localeCompare(b.id);
      });

    const activeTwo = sorted.slice(0, 2).map((p) => p.id);

    if (sorted.length > 2 && !activeTwo.includes(localSessionId)) {
      if (typeof onRoomFull === 'function') onRoomFull();
      return;
    }

    const sessionIds = activeTwo;
    const otherParticipants = sessionIds.filter((id) => id !== localSessionId);
    if (typeof onPresenceChange === 'function') {
      const isInitiator = activeTwo[0] === localSessionId;
      onPresenceChange({
        participants: sessionIds,
        otherParticipantId: otherParticipants[0] || null,
        count: sessionIds.length,
        state: sessionIds.length >= 2 ? 'connected' : 'waiting',
        isSupabase: false,
        isInitiator,
      });
    }
  };

  bc.onmessage = (event) => {
    if (isCleanedUp || !event || !event.data) return;
    const { type, senderId, targetId, payload, joinedAt } = event.data;
    if (senderId === localSessionId) return;

    if (type === 'presence:heartbeat' || type === 'presence:join') {
      const existing = knownParticipants.get(senderId);
      knownParticipants.set(senderId, {
        joinedAt: existing ? existing.joinedAt : (joinedAt || Date.now() - 500),
        lastSeen: Date.now(),
      });
      notifyPresence();
      if (type === 'presence:join') {
        // Reply with our presence so the new peer immediately knows we exist
        bc.postMessage({
          type: 'presence:heartbeat',
          senderId: localSessionId,
          joinedAt: localJoinedAt,
        });
      }
      return;
    }

    if (type === 'presence:leave') {
      knownParticipants.delete(senderId);
      notifyPresence();
      return;
    }

    if (type === 'webrtc-signal') {
      const sigTarget = targetId || payload?.targetId;
      if (sigTarget && sigTarget !== localSessionId) return;
      if (typeof onSignal === 'function') {
        onSignal(senderId, payload);
      }
    }
  };

  // Announce presence
  bc.postMessage({
    type: 'presence:join',
    senderId: localSessionId,
  });

  heartbeatInterval = setInterval(() => {
    bc.postMessage({
      type: 'presence:heartbeat',
      senderId: localSessionId,
    });
    notifyPresence();
  }, 2000);

  return {
    sendSignal: async (signalData) => {
      if (isCleanedUp) return;
      bc.postMessage({
        type: 'webrtc-signal',
        senderId: localSessionId,
        targetId: signalData.targetId,
        payload: {
          ...signalData,
          senderId: localSessionId,
        },
      });
    },
    leave: () => {
      isCleanedUp = true;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      bc.postMessage({
        type: 'presence:leave',
        senderId: localSessionId,
      });
      bc.close();
      console.log('[Signaling] Closed local BroadcastChannel');
    },
    isCloud: false,
  };
}

export default {
  createSignalingChannel,
};
