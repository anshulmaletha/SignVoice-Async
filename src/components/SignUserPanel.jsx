import { useEffect, useRef, useState } from 'react'
import { startGestureRecognition } from '../gesture/GestureRecognizer'
import { startMockGestureStream, stopMockGestureStream } from '../gesture/mockGestureData.js'
import { addMessage } from '../services/conversationStore.js'
import { speak } from '../audio/TextToSpeech.js'
import CameraFeed from './CameraFeed.jsx'
import GestureBadge from './GestureBadge.jsx'
import ConfidenceBar from './ConfidenceBar.jsx'
import ConnectionStatusBadge from './ConnectionStatusBadge.jsx'
import PermissionBanner from './PermissionBanner.jsx'

const SUPPORTED = new Set([
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

export default function SignUserPanel() {
  const videoRef = useRef(null)
  const controlRef = useRef(null)
  const streamRef = useRef(null)
  const lastGestureRef = useRef(null)
  const [errorCode, setErrorCode] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [current, setCurrent] = useState({ gesture: 'NONE', text: '', confidence: 0 })
  const [lastSpoken, setLastSpoken] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    let cancelled = false

    function handleGesture(gestureResult) {
      if (cancelled) return
      setCurrent(gestureResult)
      const { gesture, text } = gestureResult
      if (SUPPORTED.has(gesture) && gesture !== lastGestureRef.current) {
        addMessage({ sender: 'sign_user', text, type: 'sign' })
        speak(text)
        setLastSpoken(text)
      }
      lastGestureRef.current = gesture
    }

    async function start() {
      try {
        setErrorCode(null)

        if (isDemoMode) {
          try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
                audio: false,
              })
              if (cancelled) {
                stream.getTracks().forEach((t) => t.stop())
                return
              }
              streamRef.current = stream
              if (videoRef.current) {
                videoRef.current.srcObject = stream
                await new Promise((resolve) => {
                  if (videoRef.current.readyState >= 2) resolve()
                  else videoRef.current.onloadeddata = () => resolve()
                })
                await videoRef.current.play().catch(() => {})
              }
            }
          } catch (_) {
            // Camera feed optional in demo mode
          }

          startMockGestureStream(handleGesture)
          controlRef.current = { stop: stopMockGestureStream }
          setIsReady(true)
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (!videoRef.current) return
        videoRef.current.srcObject = stream

        await new Promise((resolve) => {
          if (videoRef.current.readyState >= 2) resolve()
          else videoRef.current.onloadeddata = () => resolve()
        })
        await videoRef.current.play()

        const control = await startGestureRecognition(videoRef.current, handleGesture)
        if (cancelled) {
          control.stop()
          return
        }
        controlRef.current = control
        setIsReady(true)
      } catch (err) {
        if (!cancelled) setErrorCode(err?.name ?? 'CAMERA_ERROR')
      }
    }

    start()

    return () => {
      cancelled = true
      if (controlRef.current) controlRef.current.stop()
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const id = setInterval(() => setIsSpeaking(window.speechSynthesis.speaking), 200)
    return () => clearInterval(id)
  }, [])

  function handleReplay() {
    if (lastSpoken) {
      speak(lastSpoken)
    }
  }

  return (
    <div className="sign-user-panel">
      {/* Header bar above camera */}
      <div className="sign-user-panel__header">
        <div className="vision-header-left">
          <div className="vision-status-indicator">
            <span className={`status-dot ${isReady ? 'status-dot--ready' : 'status-dot--loading'}`} />
            <span className="vision-header-title">Vision Viewport</span>
          </div>
          <ConnectionStatusBadge isReady={isReady} />
        </div>
        <div className="vision-header-right">
          <span className="panel-tag panel-tag--amber">GESTURE TRACKING</span>
        </div>
      </div>

      {errorCode && <PermissionBanner type="camera" code={errorCode} />}

      {/* Main Camera Viewport with Warm HUD Brackets */}
      <CameraFeed
        videoRef={videoRef}
        error={errorCode}
        isReady={isReady}
        gestureText={current.text}
        confidence={current.confidence}
      />

      {/* Results & Telemetry below camera */}
      <div className="vision-results-grid">
        <div className="vision-result-card vision-result-card--gesture">
          <div className="vision-result-card__label">Detected Sign</div>
          <GestureBadge gesture={current.gesture} text={current.text} />
          <ConfidenceBar confidence={current.confidence} />
        </div>

        <div className={`vision-result-card vision-result-card--tts ${isSpeaking ? 'vision-result-card--speaking' : ''}`}>
          <div className="vision-result-card__label-row">
            <span className="vision-result-card__label">Spoken Output (TTS)</span>
            {lastSpoken && (
              <button
                type="button"
                className="replay-tts-btn"
                onClick={handleReplay}
                title="Replay spoken audio"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="replay-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Replay</span>
              </button>
            )}
          </div>
          <div className="tts-output-body">
            <span className="tts-output-icon">
              {isSpeaking ? '🔊' : '🔈'}
            </span>
            <span className="tts-output-text">
              {isSpeaking ? (
                <span className="speaking-indicator">
                  Synthesizing speech
                  <span className="dot-pulse">.</span>
                  <span className="dot-pulse">.</span>
                  <span className="dot-pulse">.</span>
                </span>
              ) : lastSpoken ? (
                <span className="last-spoken-phrase">"{lastSpoken}"</span>
              ) : (
                <span className="tts-placeholder">Waiting for gesture...</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
