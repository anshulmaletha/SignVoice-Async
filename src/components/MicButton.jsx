export default function MicButton({ isListening, onToggle }) {
  return (
    <button
      type="button"
      className={`mic-button ${isListening ? 'mic-button--listening' : ''}`}
      onClick={onToggle}
    >
      {isListening ? '\u{1F399}\uFE0F Listening…' : '\u{1F3A4} Start Microphone'}
    </button>
  )
}
