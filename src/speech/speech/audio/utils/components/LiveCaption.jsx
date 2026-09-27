export default function LiveCaption({ text, isFinal }) {
  if (!text) {
    return <div className="live-caption live-caption--empty">Say something…</div>
  }
  return (
    <div className={`live-caption ${isFinal ? 'live-caption--final' : 'live-caption--interim'}`}>
      {text}
    </div>
  )
}
