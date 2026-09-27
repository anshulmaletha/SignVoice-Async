import { useRef, useState, useEffect } from 'react'
import { startListening, stopListening } from '../speech/SpeechToText.js'
import { startMockSpeechStream, stopMockSpeechStream } from '../speech/mockSpeechData.js'
import { addMessage } from '../services/conversationStore.js'
import { isTtsSpeaking, subscribeTtsState } from '../audio/TextToSpeech.js'
import MicButton from './MicButton.jsx'
import LiveCaption from './LiveCaption.jsx'
import PermissionBanner from './PermissionBanner.jsx'

const isDemoMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demoMode') === 'mock'

export default function SpeechUserPanel() {
  const [isListening, setIsListening] = useState(false)
  const [isTtsActive, setIsTtsActive] = useState(false)
  const [caption, setCaption] = useState({ text: '', isFinal: false })
  const [errorCode, setErrorCode] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const listeningRef = useRef(false)
  const statusTimerRef = useRef(null)

  useEffect(() => {
    const unsub = subscribeTtsState((active) => {
      setIsTtsActive(active)
      if (active) {
        setCaption({ text: '', isFinal: false })
      }
    })
    return unsub
  }, [])

  function handleResult(result) {
    // Guard against TTS echo audio
    if (isTtsSpeaking()) {
      return
    }

    setCaption({ text: result.text, isFinal: result.isFinal })
    if (result.isFinal) {
      addMessage({ sender: 'speech_user', text: result.text, type: 'speech' })
      setCaption({ text: '', isFinal: false })
      setStatusMessage('Voice message ready')
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => {
        setStatusMessage('')
      }, 1800)
    }
  }

  function handleError(code) {
    setErrorCode(code)
    setIsListening(false)
    listeningRef.current = false
    setStatusMessage('')
  }

  function toggleMic() {
    if (listeningRef.current) {
      if (isDemoMode) stopMockSpeechStream()
      else stopListening()
      listeningRef.current = false
      setIsListening(false)
      setStatusMessage('')
    } else {
      setErrorCode(null)
      setStatusMessage('')
      if (isDemoMode) startMockSpeechStream(handleResult)
      else startListening(handleResult, handleError)
      listeningRef.current = true
      setIsListening(true)
    }
  }

  useEffect(() => {
    return () => {
      if (listeningRef.current) {
        if (isDemoMode) stopMockSpeechStream()
        else stopListening()
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current)
      }
    }
  }, [])

  const currentStatus = !isListening
    ? 'idle'
    : isTtsActive
    ? 'muted'
    : statusMessage
    ? 'ready'
    : caption.text
    ? 'processing'
    : 'listening'

  return (
    <div className="speech-user-panel">
      <div className="speech-user-panel__header">
        <div className="speech-user-panel__controls">
          <MicButton
            isListening={isListening}
            status={currentStatus}
            onToggle={toggleMic}
          />
          {statusMessage && (
            <span className="speech-status-pill speech-status-pill--ready">
              ✓ {statusMessage}
            </span>
          )}
          {isListening && isTtsActive && (
            <span className="speech-status-pill speech-status-pill--muted">
              🔇 Speaker active (echo suppressed)
            </span>
          )}
        </div>
        <span className="panel-tag">SPEECH ENGINE</span>
      </div>
      {errorCode && <PermissionBanner type="mic" code={errorCode} />}
      <LiveCaption
        text={caption.text}
        isFinal={caption.isFinal}
        isListening={isListening && !isTtsActive}
      />
    </div>
  )
}
