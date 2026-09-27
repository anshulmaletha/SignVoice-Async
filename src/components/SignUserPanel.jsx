import { useEffect, useRef, useState } from 'react'
import { startGestureRecognition } from '../gesture/GestureRecognizer'
import { addMessage } from '../services/conversationStore.js'
import CameraFeed from './CameraFeed.jsx'
import GestureBadge from './GestureBadge.jsx'
import ConfidenceBar from './ConfidenceBar.jsx'

// NOTE: confirm with Anshul whether STOP should also post to conversation history.
const SUPPORTED = new Set(['HELLO', 'YES', 'NO', 'HELP', 'THANK_YOU', 'STOP'])

export default function SignUserPanel() {
  const videoRef = useRef(null)
  const controlRef = useRef(null)
  const streamRef = useRef(null)
  const lastGestureRef = useRef(null)
  const [error, setError] = useState(null)
  const [current, setCurrent] = useState({ gesture: 'NONE', text: '', confidence: 0 })

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        setError(null)
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

        const control = await startGestureRecognition(videoRef.current, (gestureResult) => {
          if (cancelled) return
          setCurrent(gestureResult)
          const { gesture, text } = gestureResult
          if (SUPPORTED.has(gesture) && gesture !== lastGestureRef.current) {
            addMessage({ sender: 'sign_user', text, type: 'sign' })
          }
          lastGestureRef.current = gesture
        })

        if (cancelled) {
          control.stop()
          return
        }
        controlRef.current = control
      } catch (err) {
        if (!cancelled) setError(err?.message ?? 'CAMERA_ERROR')
      }
    }

    start()

    return () => {
      cancelled = true
      if (controlRef.current) controlRef.current.stop()
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className="sign-user-panel">
      <CameraFeed videoRef={videoRef} error={error} />
      <GestureBadge gesture={current.gesture} text={current.text} />
      <ConfidenceBar confidence={current.confidence} />
    </div>
  )
}
