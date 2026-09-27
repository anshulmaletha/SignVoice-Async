export default function ConnectionStatusBadge({ isReady }) {
  return (
    <div
      className={`connection-status ${
        isReady ? 'connection-status--ready' : 'connection-status--loading'
      }`}
    >
      {isReady ? 'Ready' : 'Loading model...'}
    </div>
  )
}
