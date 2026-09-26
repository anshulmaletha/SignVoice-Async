export default function GestureBadge({ gesture, text }) {
  if (gesture === 'NONE') {
    return <div className="gesture-badge gesture-badge--none">Show your hand</div>
  }
  if (gesture === 'UNKNOWN') {
    return <div className="gesture-badge gesture-badge--unknown">Gesture not recognized</div>
  }
  return <div className="gesture-badge gesture-badge--active">{text}</div>
}
