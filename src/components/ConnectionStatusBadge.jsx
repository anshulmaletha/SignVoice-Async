import React from 'react'

export default function ConnectionStatusBadge({ isReady }) {
  return (
    <div
      className={`connection-status ${
        isReady ? 'connection-status--ready' : 'connection-status--loading'
      }`}
    >
      <span className="connection-status__dot" />
      <span className="connection-status__text">
        {isReady ? 'Camera Ready' : 'Loading model...'}
      </span>
    </div>
  )
}
