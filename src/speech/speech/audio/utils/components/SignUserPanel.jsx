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

const SUPPORTED = new Set(['HELLO', 'YES', 'NO', 'HELP', 'THANK_YOU', 'STOP'])

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

        if (isDemoMode) {
          startMockGestureStream(handleGesture)
          controlRef.current = { stop: stopMockGestureStream }
          setIsReady(true)
          return
        }

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

  return (
    <div className="sign-user-panel">
      <ConnectionStatusBadge isReady={isReady} />
      {errorCode && <PermissionBanner type="camera" code={errorCode} />}
      <CameraFeed videoRef={videoRef} error={errorCode} />
      <GestureBadge gesture={current.gesture} text={current.text} />
      <ConfidenceBar confidence={current.confidence} />
      <div className="sign-to-speech-result">
        <span className="sign-to-speech-result__icon">{'\u{1F50A}'}</span>
        <span className="sign-to-speech-result__text">
          {isSpeaking ? 'Speaking…' : lastSpoken ? `Last: "${lastSpoken}"` : 'Waiting for a gesture…'}
        </span>
      </div>
    </div>
  )
}
