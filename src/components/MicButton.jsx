export default function MicButton({ isListening, status = 'idle', onToggle }) {
  const label = !isListening
    ? 'Start Microphone'
    : status === 'muted'
    ? 'Echo Suppressed'
    : status === 'processing'
    ? 'Processing...'
    : 'Listening...'

  return (
    <button
      type="button"
      className={`mic-button ${isListening ? 'mic-button--listening' : ''} ${
        status === 'processing' ? 'mic-button--processing' : ''
      } ${status === 'muted' ? 'mic-button--muted' : ''}`}
      onClick={onToggle}
      aria-label={label}
    >
      <span className="mic-button__icon">
        {!isListening ? '🎙️' : status === 'muted' ? '🔇' : '🔴'}
      </span>
      <span className="mic-button__label">{label}</span>
      {isListening && status !== 'muted' && (
        <span className="mic-button__waves" aria-hidden="true">
          <span className="wave-bar"></span>
          <span className="wave-bar"></span>
          <span className="wave-bar"></span>
        </span>
      )}
    </button>
  )
}
