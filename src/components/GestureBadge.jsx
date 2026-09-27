export default function GestureBadge({ gesture, text }) {
  if (gesture === 'NONE') {
    return (
      <div className="gesture-badge gesture-badge--none">
        <span className="gesture-badge__icon">👋</span>
        <span>Show your hand</span>
      </div>
    )
  }
  if (gesture === 'UNKNOWN') {
    return (
      <div className="gesture-badge gesture-badge--unknown">
        <span className="gesture-badge__spinner" />
        <span>Recognizing...</span>
      </div>
    )
  }
  return (
    <div className="gesture-badge gesture-badge--active">
      <span className="gesture-badge__label">Gesture detected:</span>
      <span className="gesture-badge__value">{text}</span>
    </div>
  )
}
