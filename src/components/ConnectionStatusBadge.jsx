export default function ConnectionStatusBadge({ isReady }) {
  return (
    <div
      className={`connection-status ${
        isReady ? 'connection-status--ready' : 'connection-status--loading'
      }`}
    >
      <span className="connection-status__dot" />
      {isReady ? 'Camera Ready' : 'Loading model...'}
    </div>
  )
}
