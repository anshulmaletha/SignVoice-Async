import React, { useState, useEffect, useRef } from 'react'
import '../../styles/meeting.css'
import MeetingHeader from './MeetingHeader.jsx'
import { isValidMeetingId } from '../../utils/meetingId.js'
import { getOrCreateSessionId } from '../../services/sessionService.js'
import { createSignalingChannel } from '../../services/webrtcSignaling.js'
import { acquireLocalMedia, createPeerSession } from '../../services/webrtcManager.js'
import { startGestureRecognition } from '../../gesture/GestureRecognizer.js'
import { startMockGestureStream, stopMockGestureStream } from '../../gesture/mockGestureData.js'
import { startListening, stopListening } from '../../speech/SpeechToText.js'
import { startMockSpeechStream, stopMockSpeechStream } from '../../speech/mockSpeechData.js'
import { speak } from '../../audio/TextToSpeech.js'
import { addMessage } from '../../services/conversationStore.js'
import { nextId } from '../../utils/idGenerator.js'

const SUPPORTED_GESTURES = new Set([
  'HELLO',
  'YES',
  'NO',
  'HELP',
  'THANK_YOU',
  'STOP',
  'WAIT',
  'WATER',
  'FOOD',
  'GOODBYE',
  'PLEASE',
  'SORRY'
])

const isDemoMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demoMode') === 'mock'

export default function MeetingRoom({ meetingId, onLeaveMeeting }) {
  const [connectionState, setConnectionState] = useState('waiting') // 'waiting' | 'connecting' | 'connected' | 'disconnected' | 'full'
  const [isRoomFull, setIsRoomFull] = useState(false)
  const [mediaError, setMediaError] = useState(null)
  const [signalingError, setSignalingError] = useState(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [remoteMediaState, setRemoteMediaState] = useState({ cameraOn: true, micOn: true })
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [isCloudSignaling, setIsCloudSignaling] = useState(false)
  const [audioAutoplayBlocked, setAudioAutoplayBlocked] = useState(false)

  // Phase 4: Sign, Speech, and Chat state
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [detectedSign, setDetectedSign] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [interimCaption, setInterimCaption] = useState('')

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const localStreamRef = useRef(null)
  const peerSessionRef = useRef(null)
  const signalingRef = useRef(null)
  const activeRemoteIdRef = useRef(null)
  const disconnectTimerRef = useRef(null)
  const signalQueueRef = useRef([])

  // Phase 4 Refs
  const chatFeedRef = useRef(null)
  const ttsEnabledRef = useRef(ttsEnabled)
  const handleRemoteCommunicationRef = useRef(null)
  const signClearTimerRef = useRef(null)
  const lastLocalSignRef = useRef('')
  const lastLocalSignTimeRef = useRef(0)
  const lastFinalSpeechRef = useRef('')
  const lastFinalSpeechTimeRef = useRef(0)
  const transcribingRef = useRef(false)
  const gestureControlRef = useRef(null)

  useEffect(() => {
    ttsEnabledRef.current = ttsEnabled
  }, [ttsEnabled])

  useEffect(() => {
    transcribingRef.current = isTranscribing
  }, [isTranscribing])

  // Auto-scroll chat feed to latest message
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [chatMessages])

  // 1. Initial ID Validation
  const valid = isValidMeetingId(meetingId)

  // 2. Initialize Media & WebRTC Signaling
  useEffect(() => {
    if (!valid) return

    let isCancelled = false
    const localSessionId = getOrCreateSessionId()

    async function initCall() {
      // Step A: Acquire Local Camera & Microphone
      try {
        console.log('[MeetingRoom] Acquiring local camera and microphone...')
        const stream = await acquireLocalMedia({ video: true, audio: true })
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        localStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('[MeetingRoom] Media acquisition error:', err)
        if (!isCancelled) {
          setMediaError(
            err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
              ? 'CAMERA_MIC_PERMISSION_DENIED'
              : 'MEDIA_DEVICE_UNAVAILABLE'
          )
        }
      }

      // Step B: Set up Signaling & Presence
      try {
        console.log(`[MeetingRoom] Joining signaling channel for room: ${meetingId}`)
        const signaling = createSignalingChannel({
          meetingId,
          localSessionId,
          onSignal: (senderId, signal) => {
            if (isCancelled || !signal) return

            // Application-level communication events (sign, speech, chat)
            if (signal.type === 'sign' || signal.type === 'speech' || signal.type === 'chat') {
              if (handleRemoteCommunicationRef.current) {
                handleRemoteCommunicationRef.current(signal)
              }
              return
            }

            // WebRTC peer connection signaling
            if (peerSessionRef.current) {
              peerSessionRef.current.handleSignal(signal)
            } else {
              console.log(`[Signaling Trace] Signal queued because peer session is not ready: ${signal?.type}`)
              signalQueueRef.current.push(signal)
            }
          },
          onPresenceChange: ({ otherParticipantId, count, isSupabase, isInitiator }) => {
            if (isCancelled) return
            setIsCloudSignaling(isSupabase)
            setSignalingError(null)

            if (!otherParticipantId) {
              // Remote peer temporarily absent or disconnected
              if (activeRemoteIdRef.current) {
                if (!disconnectTimerRef.current) {
                  console.log('[MeetingRoom] Remote participant absent in presence sync. Starting 3.5s grace timer...')
                  disconnectTimerRef.current = setTimeout(() => {
                    disconnectTimerRef.current = null
                    if (isCancelled) return

                    console.log('[MeetingRoom] 3.5s grace timer expired. Tearing down remote peer session.')
                    activeRemoteIdRef.current = null
                    if (peerSessionRef.current) {
                      peerSessionRef.current.close()
                      peerSessionRef.current = null
                    }
                    signalQueueRef.current = []
                    setHasRemoteVideo(false)
                    if (remoteVideoRef.current) {
                      remoteVideoRef.current.srcObject = null
                    }
                    if (remoteAudioRef.current) {
                      remoteAudioRef.current.srcObject = null
                    }
                    setConnectionState('disconnected')
                    setTimeout(() => {
                      if (!isCancelled && !activeRemoteIdRef.current) {
                        setConnectionState('waiting')
                      }
                    }, 3000)
                  }, 3500)
                }
              } else {
                setConnectionState('waiting')
              }
              return
            }

            // Remote peer is present
            // If a grace timer was running, cancel it
            if (disconnectTimerRef.current) {
              console.log(`[MeetingRoom] Remote participant presence confirmed (${otherParticipantId}) before grace timer expired. Cancelling timer.`)
              clearTimeout(disconnectTimerRef.current)
              disconnectTimerRef.current = null
            }

            // If the same remote peer is already active and we already have a peer session, keep it alive
            if (otherParticipantId === activeRemoteIdRef.current && peerSessionRef.current) {
              console.log(`[MeetingRoom] Remote peer ${otherParticipantId} already active. Keeping existing WebRTC connection alive.`)
              return
            }

            // Remote peer joined or changed
            console.log(`[MeetingRoom] Remote participant joined: ${otherParticipantId}, isInitiator=${isInitiator}`)
            activeRemoteIdRef.current = otherParticipantId
            setConnectionState('connecting')

            // Start WebRTC Peer Session
            if (peerSessionRef.current) {
              peerSessionRef.current.close()
            }

            peerSessionRef.current = createPeerSession({
              localSessionId,
              remoteSessionId: otherParticipantId,
              isInitiator,
              localStream: localStreamRef.current,
              sendSignal: (sig) => signalingRef.current?.sendSignal(sig),
              onRemoteStream: (remoteStream) => {
                console.log('[MeetingRoom] Remote stream arrived with tracks:', remoteStream.getTracks().map((t) => `${t.kind}:${t.id}`))
                
                // Attach to video element (muted to prevent duplicate audio and satisfy autoplay)
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream
                  setHasRemoteVideo(true)
                }

                // Attach to dedicated remote audio element (Fix 2)
                if (remoteAudioRef.current) {
                  remoteAudioRef.current.srcObject = remoteStream
                  remoteAudioRef.current.muted = false
                  remoteAudioRef.current.volume = 1.0
                  const playPromise = remoteAudioRef.current.play()
                  if (playPromise !== undefined) {
                    playPromise
                      .then(() => {
                        console.log('[WebRTC Diagnostic] Remote audio .play() succeeded')
                        setAudioAutoplayBlocked(false)
                      })
                      .catch((err) => {
                        console.warn('[WebRTC Diagnostic] Remote audio .play() failed (autoplay policy):', err)
                        setAudioAutoplayBlocked(true)
                      })
                  }
                }

                setConnectionState('connected')
              },
              onConnectionStateChange: (state) => {
                console.log(`[MeetingRoom] WebRTC State: ${state}`)
                if (state === 'connected') {
                  setConnectionState('connected')
                } else if (state === 'disconnected') {
                  console.log('[MeetingRoom] WebRTC State disconnected (ICE will attempt self-recovery)')
                  setConnectionState('reconnecting')
                } else if (state === 'failed') {
                  console.log('[MeetingRoom] WebRTC State failed')
                  setConnectionState('reconnecting')
                }
              },
              onRemoteMediaState: (state) => {
                if (state) {
                  setRemoteMediaState((prev) => ({ ...prev, ...state }))
                }
              },
            })

            // FIX 1: Immediately replay any early queued signals
            if (signalQueueRef.current.length > 0) {
              const queuedSignals = [...signalQueueRef.current]
              signalQueueRef.current = []
              console.log(`[Signaling Trace] Replaying ${queuedSignals.length} queued signal(s)...`)
              queuedSignals.forEach((sig) => {
                console.log(`[Signaling Trace] Replaying queued signal: ${sig?.type}`)
                peerSessionRef.current.handleSignal(sig)
              })
            }
          },
          onRoomFull: () => {
            if (!isCancelled) {
              console.warn('[MeetingRoom] Room capacity reached (max 2 participants)')
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((track) => track.stop())
                localStreamRef.current = null
              }
              setIsRoomFull(true)
              setConnectionState('full')
            }
          },
          onError: (status) => {
            if (!isCancelled) {
              console.warn('[MeetingRoom] Signaling channel error:', status)
              setSignalingError('SIGNALING_UNAVAILABLE')
              setConnectionState('disconnected')
            }
          },
        })

        signalingRef.current = signaling
      } catch (signalingErr) {
        console.error('[MeetingRoom] Signaling channel setup failure:', signalingErr)
      }
    }

    initCall()

    // Step C: Cleanup on Unmount or Leave
    return () => {
      isCancelled = true
      console.log('[MeetingRoom] Cleaning up meeting room session...')
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current)
        disconnectTimerRef.current = null
      }
      if (peerSessionRef.current) {
        peerSessionRef.current.close()
        peerSessionRef.current = null
      }
      if (signalingRef.current) {
        signalingRef.current.leave()
        signalingRef.current = null
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }
      signalQueueRef.current = []
      activeRemoteIdRef.current = null
    }
  }, [meetingId, valid])

  // Media Toggle Handlers
  const handleToggleCamera = () => {
    const nextState = !isCameraOn
    setIsCameraOn(nextState)
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = nextState
      })
    }
    if (peerSessionRef.current) {
      peerSessionRef.current.setCameraEnabled(nextState)
    }
  }

  const handleToggleMic = () => {
    const nextState = !isMicOn
    setIsMicOn(nextState)
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nextState
      })
    }
    if (peerSessionRef.current) {
      peerSessionRef.current.setMicEnabled(nextState)
    }
  }

  const handleEnableAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => {
          console.log('[WebRTC Diagnostic] Remote audio enabled successfully via user tap')
          setAudioAutoplayBlocked(false)
        })
        .catch((err) => {
          console.error('[WebRTC Diagnostic] Remote audio play failed on user tap:', err)
        })
    }
  }

  // Phase 4: Remote Communication Handler
  const handleRemoteCommunication = (signal) => {
    if (!signal) return
    const now = Date.now()

    if (signal.type === 'sign') {
      const signText = signal.text || signal.gesture
      if (!signText) return

      const msg = {
        id: nextId(),
        sender: 'remote',
        type: 'sign',
        text: signText,
        gesture: signal.gesture,
        timestamp: signal.timestamp || now,
      }
      setChatMessages((prev) => [...prev, msg])
      addMessage({ sender: 'speech_user', text: `[Sign] ${signText}`, type: 'sign' })

      // Incoming sign -> TTS (respect ttsEnabled toggle)
      if (ttsEnabledRef.current) {
        speak(signText)
      }
    } else if (signal.type === 'speech') {
      const speechText = signal.text
      if (!speechText) return

      const msg = {
        id: nextId(),
        sender: 'remote',
        type: 'speech',
        text: speechText,
        timestamp: signal.timestamp || now,
      }
      setChatMessages((prev) => [...prev, msg])
      addMessage({ sender: 'speech_user', text: `[Speech] ${speechText}`, type: 'speech' })
      // Do NOT generate TTS for incoming speech
    } else if (signal.type === 'chat') {
      const chatText = signal.text
      if (!chatText) return

      const msg = {
        id: nextId(),
        sender: 'remote',
        type: 'text',
        text: chatText,
        timestamp: signal.timestamp || now,
      }
      setChatMessages((prev) => [...prev, msg])
      addMessage({ sender: 'speech_user', text: `[Text] ${chatText}`, type: 'speech' })
      // Do NOT generate TTS for typed chat
    }
  }

  useEffect(() => {
    handleRemoteCommunicationRef.current = handleRemoteCommunication
  })

  // Phase 4: Local Gesture Detection Handler
  const handleLocalGesture = (gestureResult) => {
    if (!gestureResult || !gestureResult.gesture) return
    const { gesture, text } = gestureResult
    if (gesture === 'NONE' || gesture === 'UNKNOWN' || !SUPPORTED_GESTURES.has(gesture)) {
      return
    }

    const now = Date.now()
    if (
      gesture !== lastLocalSignRef.current ||
      now - lastLocalSignTimeRef.current > 1500
    ) {
      lastLocalSignRef.current = gesture
      lastLocalSignTimeRef.current = now

      const signText = text || gesture
      setDetectedSign(signText)
      if (signClearTimerRef.current) clearTimeout(signClearTimerRef.current)
      signClearTimerRef.current = setTimeout(() => {
        setDetectedSign('')
      }, 3000)

      const msg = {
        id: nextId(),
        sender: 'local',
        type: 'sign',
        text: signText,
        gesture,
        timestamp: now,
      }
      setChatMessages((prev) => [...prev, msg])
      addMessage({ sender: 'sign_user', text: `[Sign] ${signText}`, type: 'sign' })

      // Broadcast sign to remote peer
      signalingRef.current?.sendSignal({
        type: 'sign',
        text: signText,
        gesture,
        timestamp: now,
      })
      // Local sign does NOT trigger local TTS
    }
  }

  // Effect: Continuous gesture recognition on local camera feed
  useEffect(() => {
    if (!isCameraOn) {
      if (gestureControlRef.current) {
        try { gestureControlRef.current.stop() } catch (_) {}
        gestureControlRef.current = null
      }
      setDetectedSign('')
      return
    }

    let isCancelled = false

    async function startGesture() {
      try {
        const video = localVideoRef.current
        if (!video) return

        if (video.readyState < 2) {
          await new Promise((resolve) => {
            const onLoaded = () => {
              video.removeEventListener('loadeddata', onLoaded)
              resolve()
            }
            video.addEventListener('loadeddata', onLoaded)
            setTimeout(resolve, 2500)
          })
        }
        if (isCancelled) return

        if (isDemoMode) {
          startMockGestureStream(handleLocalGesture)
          gestureControlRef.current = { stop: stopMockGestureStream }
        } else {
          const control = await startGestureRecognition(video, handleLocalGesture, {
            enableConsoleLogging: false,
          })
          if (isCancelled) {
            control.stop()
            return
          }
          gestureControlRef.current = control
        }
      } catch (err) {
        console.warn('[MeetingRoom] Gesture recognition init:', err)
      }
    }

    startGesture()

    return () => {
      isCancelled = true
      if (gestureControlRef.current) {
        try { gestureControlRef.current.stop() } catch (_) {}
        gestureControlRef.current = null
      }
    }
  }, [isCameraOn])

  // Phase 4: Local Speech-to-Text Transcription Handler
  const handleSpeechResult = (result) => {
    if (!result) return

    if (!result.isFinal) {
      setInterimCaption(result.text || '')
      return
    }

    const finalText = (result.text || '').trim()
    setInterimCaption('')
    if (!finalText) return

    const now = Date.now()
    if (
      finalText.toLowerCase() === lastFinalSpeechRef.current.toLowerCase() &&
      now - lastFinalSpeechTimeRef.current < 1500
    ) {
      return
    }
    lastFinalSpeechRef.current = finalText
    lastFinalSpeechTimeRef.current = now

    const msg = {
      id: nextId(),
      sender: 'local',
      type: 'speech',
      text: finalText,
      timestamp: now,
    }
    setChatMessages((prev) => [...prev, msg])
    addMessage({ sender: 'sign_user', text: `[Speech] ${finalText}`, type: 'speech' })

    // Broadcast finalized speech transcript to remote peer
    signalingRef.current?.sendSignal({
      type: 'speech',
      text: finalText,
      timestamp: now,
    })
  }

  const handleToggleTranscription = () => {
    if (transcribingRef.current) {
      setIsTranscribing(false)
      setInterimCaption('')
      if (isDemoMode) stopMockSpeechStream()
      else stopListening()
    } else {
      if (
        !isDemoMode &&
        typeof window !== 'undefined' &&
        !('SpeechRecognition' in window) &&
        !('webkitSpeechRecognition' in window)
      ) {
        setInterimCaption('Speech recognition is not supported in this browser.')
        setTimeout(() => setInterimCaption(''), 3500)
        return
      }
      setIsTranscribing(true)
      setInterimCaption('')
      if (isDemoMode) {
        startMockSpeechStream(handleSpeechResult)
      } else {
        startListening(handleSpeechResult, (err) => {
          console.warn('[MeetingRoom] Speech recognition fatal error:', err)
          if (err === 'PERMISSION_DENIED') {
            setInterimCaption('Microphone permission denied for speech recognition.')
          } else if (err === 'SERVICE_NOT_ALLOWED') {
            setInterimCaption('Speech recognition service disallowed by browser.')
          } else if (err === 'NETWORK_ERROR') {
            setInterimCaption('Speech recognition network service unavailable.')
          } else {
            setInterimCaption(`Speech recognition error: ${err}`)
          }
          setTimeout(() => setInterimCaption(''), 4000)
          setIsTranscribing(false)
        })
      }
    }
  }

  // Cleanup speech & timers on unmount
  useEffect(() => {
    return () => {
      if (transcribingRef.current) {
        if (isDemoMode) stopMockSpeechStream()
        else stopListening()
      }
      if (signClearTimerRef.current) {
        clearTimeout(signClearTimerRef.current)
      }
    }
  }, [])

  // Phase 4: Typed Chat Submit Handler
  const handleSendChatMessage = (e) => {
    if (e) e.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed) return

    const now = Date.now()
    const msg = {
      id: nextId(),
      sender: 'local',
      type: 'text',
      text: trimmed,
      timestamp: now,
    }
    setChatMessages((prev) => [...prev, msg])
    addMessage({ sender: 'sign_user', text: `[Text] ${trimmed}`, type: 'speech' })
    setChatInput('')

    signalingRef.current?.sendSignal({
      type: 'chat',
      text: trimmed,
      timestamp: now,
    })
  }

  // Phase 4: Diagnostic and Verification Bridge
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__signvoice = {
        sendSign: (gesture, text) => {
          handleLocalGesture({ gesture, text: text || gesture })
        },
        sendSpeech: (text) => {
          handleSpeechResult({ text, isFinal: true })
        },
        getChatMessages: () => chatMessages,
        toggleTranscription: handleToggleTranscription,
        toggleCamera: handleToggleCamera,
        toggleMic: handleToggleMic,
        toggleTts: () => setTtsEnabled((prev) => !prev),
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.__signvoice
      }
    }
  }, [chatMessages, isCameraOn, isMicOn, ttsEnabled, isTranscribing])

  // 3. Invalid Meeting ID Screen
  if (!valid) {
    return (
      <div className="meeting-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '440px',
          padding: '36px',
          background: 'var(--bg-card, #f3eee8)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color, #d2c8c1)'
        }}>
          <h2 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--charcoal-dark, #323232)' }}>
            Invalid Meeting ID
          </h2>
          <p style={{ marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-muted, #706761)' }}>
            The meeting link you opened does not appear to be a valid SignVoice room identifier. Valid meeting IDs follow the format <code>SV-XXXXXX</code>.
          </p>
          <button
            type="button"
            className="btn-pill"
            onClick={onLeaveMeeting}
            style={{ padding: '10px 24px', fontWeight: 600 }}
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  // 4. Room Full Screen (Max 2 participants)
  if (isRoomFull) {
    return (
      <div className="meeting-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '460px',
          padding: '36px',
          background: 'var(--bg-card, #f3eee8)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-color, #d2c8c1)'
        }}>
          <div style={{ fontSize: '44px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--charcoal-dark, #323232)' }}>
            Meeting Room Full
          </h2>
          <p style={{ marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-muted, #706761)' }}>
            Room <strong>{meetingId}</strong> already has two active participants. SignVoice rooms currently support exactly two people for one-on-one communication.
          </p>
          <button
            type="button"
            className="btn-pill"
            onClick={onLeaveMeeting}
            style={{ padding: '10px 24px', fontWeight: 600 }}
          >
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="meeting-container">
      {/* 1. Header */}
      <MeetingHeader
        meetingId={meetingId}
        connectionState={connectionState}
        ttsEnabled={ttsEnabled}
        onToggleTts={() => setTtsEnabled((prev) => !prev)}
        onLeaveMeeting={onLeaveMeeting}
      />

      {/* Media Permission Warning Banner if Blocked */}
      {mediaError && (
        <div style={{ padding: '8px 24px', backgroundColor: '#fcf2f2' }}>
          <div className="meeting-error-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              {mediaError === 'CAMERA_MIC_PERMISSION_DENIED'
                ? 'Camera or microphone access was denied. Please allow permissions in browser settings to participate in the call.'
                : 'Unable to access your camera or microphone device. Please verify your hardware connection.'}
            </span>
          </div>
        </div>
      )}

      {/* Signaling Warning Banner if Disconnected / Error */}
      {signalingError && (
        <div style={{ padding: '8px 24px', backgroundColor: '#fff9e6' }}>
          <div
            className="meeting-error-banner"
            style={{ backgroundColor: '#fff3cd', borderColor: '#ffeeba', color: '#856404' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              Signaling service is experiencing connectivity issues. WebRTC connection may be interrupted or reconnecting...
            </span>
          </div>
        </div>
      )}

      {/* 2. Main Meeting Body */}
      <div className="meeting-body">
        {/* Left Column: Two-Person Video Grid + Controls */}
        <div className="meeting-stage-column">
          <div className="meeting-video-grid">
            {/* Local Video Card (You) */}
            <div className="meeting-video-card meeting-video-card--local">
              <div className="meeting-video-card__overlay-top">
                <span className="meeting-participant-pill">
                  <span className="meeting-status-dot" style={{ backgroundColor: '#7f9a78' }} />
                  You (Local) {!isMicOn && '• Muted'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#ddd0c8' }}>
                  {isCloudSignaling ? 'Cloud Sync' : 'Local Channel'}
                </span>
              </div>

              {/* Local Live Camera Feed */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ display: isCameraOn ? 'block' : 'none' }}
              />

              {/* Local Camera Off Overlay */}
              {!isCameraOn && (
                <div className="meeting-camera-off-overlay">
                  <div className="meeting-camera-off-avatar">📹</div>
                  <div className="meeting-camera-off-title">Your Camera is Turned Off</div>
                </div>
              )}

              <div className="meeting-video-card__overlay-bottom">
                <span className={`meeting-sign-pill ${detectedSign ? 'meeting-sign-pill--detected' : ''}`}>
                  <span>🤟</span>
                  <span>{detectedSign ? `Sign: ${detectedSign}` : 'Sign Detection Active'}</span>
                </span>
                {interimCaption && (
                  <div className="meeting-interim-caption" title="Interim speech transcription">
                    <span>🗣️ "{interimCaption}"</span>
                  </div>
                )}
              </div>
            </div>

            {/* Remote Video Card (Friend) */}
            <div className="meeting-video-card meeting-video-card--remote">
              <div className="meeting-video-card__overlay-top">
                <span className="meeting-participant-pill">
                  <span
                    className="meeting-status-dot"
                    style={{
                      backgroundColor:
                        connectionState === 'connected'
                          ? '#7f9a78'
                          : connectionState === 'connecting'
                          ? '#d4a373'
                          : '#a99a91',
                    }}
                  />
                  Friend (Remote) {!remoteMediaState.micOn && '• Muted'}
                </span>
              </div>

              {/* Dedicated Remote Audio Element (Unmuted, separate from video element) */}
              <audio
                ref={remoteAudioRef}
                autoPlay
                playsInline
                style={{
                  position: 'absolute',
                  width: '1px',
                  height: '1px',
                  opacity: 0.01,
                  pointerEvents: 'none',
                  bottom: 0,
                  left: 0,
                }}
              />

              {/* Autoplay blocked banner: Tap to Enable Audio */}
              {audioAutoplayBlocked && (
                <button
                  type="button"
                  className="meeting-enable-audio-btn"
                  onClick={handleEnableAudio}
                  style={{
                    position: 'absolute',
                    top: '52px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 30,
                    background: '#e07a5f',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '24px',
                    padding: '10px 18px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  aria-label="Tap to Enable Audio"
                >
                  🔊 Tap to Enable Audio
                </button>
              )}

              {/* Remote Live Video (Muted so video autoplays without restriction, audio is handled via dedicated audio element) */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  display:
                    hasRemoteVideo && remoteMediaState.cameraOn ? 'block' : 'none',
                }}
              />

              {/* Remote Camera Turned Off by Peer */}
              {hasRemoteVideo && !remoteMediaState.cameraOn && (
                <div className="meeting-camera-off-overlay">
                  <div className="meeting-camera-off-avatar">👤</div>
                  <div className="meeting-camera-off-title">Friend's Camera is Turned Off</div>
                </div>
              )}

              {/* Waiting for Remote Peer Placeholder */}
              {!hasRemoteVideo && (
                <div className="meeting-video-placeholder">
                  <div className="meeting-placeholder-icon">👥</div>
                  <div className="meeting-placeholder-title">
                    {connectionState === 'connecting'
                      ? 'Connecting to Friend...'
                      : connectionState === 'disconnected'
                      ? 'Friend Disconnected'
                      : 'Waiting for Friend to Join'}
                  </div>
                  <div className="meeting-placeholder-sub">
                    {connectionState === 'connecting'
                      ? 'Negotiating secure WebRTC peer connection...'
                      : 'Copy the meeting link above and share it with your friend to connect.'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Meeting Controls Bar */}
          <nav className="meeting-controls-bar" aria-label="Meeting Controls">
            <button
              type="button"
              className={`meeting-control-btn ${isMicOn ? 'meeting-control-btn--active' : 'meeting-control-btn--off'}`}
              onClick={handleToggleMic}
              aria-label={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
              title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMicOn ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15a3 3 0 003-3V6a3 3 0 00-3-3 3 3 0 00-3 3v6a3 3 0 003 3z" />
                ) : (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" stroke="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v3a3 3 0 005.12 2.12M15 9.34V6a3 3 0 00-5.94-.6" />
                  </>
                )}
              </svg>
              <span>{isMicOn ? 'Mic ON' : 'Muted'}</span>
            </button>

            <button
              type="button"
              className={`meeting-control-btn ${isCameraOn ? 'meeting-control-btn--active' : 'meeting-control-btn--off'}`}
              onClick={handleToggleCamera}
              aria-label={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              title={isCameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isCameraOn ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                ) : (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" stroke="currentColor" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3l2-3h6l2 3h1.5" />
                  </>
                )}
              </svg>
              <span>{isCameraOn ? 'Cam ON' : 'Cam OFF'}</span>
            </button>

            <button
              type="button"
              className={`meeting-control-btn ${chatOpen ? 'meeting-control-btn--active' : ''}`}
              onClick={() => setChatOpen((prev) => !prev)}
              aria-label="Toggle Communication Chat"
              title="Toggle Communication Chat"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Feed</span>
            </button>

            <button
              type="button"
              className={`meeting-control-btn ${isTranscribing ? 'meeting-control-btn--active' : ''}`}
              onClick={handleToggleTranscription}
              aria-label={isTranscribing ? 'Turn Off Speech Transcription' : 'Turn On Speech Transcription'}
              title={isTranscribing ? 'Turn Off Speech Transcription' : 'Turn On Speech Transcription'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>{isTranscribing ? 'Speech ON' : 'Speech OFF'}</span>
            </button>

            <button
              type="button"
              className={`meeting-control-btn ${ttsEnabled ? '' : 'meeting-control-btn--off'}`}
              onClick={() => setTtsEnabled((prev) => !prev)}
              aria-label="Toggle Text-to-Speech"
              title="Toggle Text-to-Speech"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <span>{ttsEnabled ? 'TTS ON' : 'TTS OFF'}</span>
            </button>

            <button
              type="button"
              className="meeting-control-btn meeting-control-btn--leave"
              onClick={onLeaveMeeting}
              aria-label="End Meeting"
              title="End Meeting"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>Leave</span>
            </button>
          </nav>
        </div>

        {/* Right Column: Unified Communication Feed */}
        {chatOpen && (
          <aside className="meeting-chat-sidebar" aria-label="SignVoice Communication Feed">
            <div className="meeting-chat-header">
              <span className="meeting-chat-title">
                <span>🤟</span>
                <span>Communication Feed</span>
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #706761)' }}>
                {connectionState === 'connected' ? 'Active' : 'Standby'}
              </span>
            </div>

            <div className="meeting-chat-feed" ref={chatFeedRef}>
              {chatMessages.length === 0 ? (
                <div className="meeting-chat-empty">
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>💬</div>
                  <p style={{ fontWeight: 600, color: 'var(--charcoal-dark, #323232)' }}>
                    Conversation Feed Ready
                  </p>
                  <small style={{ color: 'var(--text-muted, #706761)' }}>
                    Perform hand signs, activate voice speech, or type messages below.
                  </small>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`meeting-msg-item meeting-msg-item--${msg.type}`}
                  >
                    <div className="meeting-msg-header">
                      <span className="meeting-msg-tag">
                        {msg.type === 'sign' && '🤟 [Sign]'}
                        {msg.type === 'speech' && '🗣️ [Speech]'}
                        {msg.type === 'text' && '💬 [Text]'}
                        <span
                          style={{
                            marginLeft: '5px',
                            fontWeight: 600,
                            color: msg.sender === 'local' ? '#8c7b70' : '#2a9d8f',
                          }}
                        >
                          {msg.sender === 'local' ? 'You' : 'Friend'}
                        </span>
                      </span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="meeting-msg-body">{msg.text}</div>
                  </div>
                ))
              )}
            </div>

            <form
              className="meeting-chat-input-wrap"
              onSubmit={handleSendChatMessage}
            >
              <input
                type="text"
                placeholder="Type a message..."
                className="meeting-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button
                type="submit"
                className="meeting-chat-send-btn"
                disabled={!chatInput.trim()}
              >
                Send
              </button>
            </form>
          </aside>
        )}
      </div>
    </div>
  )
}
