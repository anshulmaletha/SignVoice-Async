import { useRef, useState, useEffect } from 'react'
import { startListening, stopListening } from '../speech/SpeechToText.js'
import { startMockSpeechStream, stopMockSpeechStream } from '../speech/mockSpeechData.js'
import { addMessage } from '../services/conversationStore.js'
import MicButton from './MicButton.jsx'
import LiveCaption from './LiveCaption.jsx'
import PermissionBanner from './PermissionBanner.jsx'

const isDemoMode =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('demoMode') === 'mock'

export default function SpeechUserPanel() {
  const [isListening, setIsListening] = useState(false)
  const [caption, setCaption] = useState({ text: '', isFinal: false })
  const [errorCode, setErrorCode] = useState(null)
  const listeningRef = useRef(false)

  function handleResult(result) {
    setCaption({ text: result.text, isFinal: result.isFinal })
    if (result.isFinal) {
      addMessage({ sender: 'speech_user', text: result.text, type: 'speech' })
      setCaption({ text: '', isFinal: false })
    }
  }

  function handleError(code) {
    setErrorCode(code)
    setIsListening(false)
    listeningRef.current = false
  }

  function toggleMic() {
    if (listeningRef.current) {
      if (isDemoMode) stopMockSpeechStream()
      else stopListening()
      listeningRef.current = false
      setIsListening(false)
    } else {
      setErrorCode(null)
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
    }
  }, [])

  return (
    <div className="speech-user-panel">
      <MicButton isListening={isListening} onToggle={toggleMic} />
      {errorCode && <PermissionBanner type="mic" code={errorCode} />}
      <LiveCaption text={caption.text} isFinal={caption.isFinal} />
    </div>
  )
}
