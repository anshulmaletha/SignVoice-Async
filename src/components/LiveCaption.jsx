export default function LiveCaption({ text, isFinal, isListening }) {
  if (!text) {
    return (
      <div className="live-caption live-caption--empty">
        <span className="live-caption__placeholder">
          {isListening ? 'Listening for speech… say something' : 'Say something…'}
        </span>
        {isListening && <span className="live-caption__cursor" aria-hidden="true" />}
      </div>
    )
  }
  return (
    <div className={`live-caption ${isFinal ? 'live-caption--final' : 'live-caption--interim'}`}>
      <span className="live-caption__content">{text}</span>
      {!isFinal && <span className="live-caption__cursor" aria-hidden="true" />}
    </div>
  )
}
