import React from 'react'

export default function Header() {
  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div className="topbar-session-badge">
          <span className="topbar-live-dot" />
          <span className="topbar-session-title">LIVE SESSION</span>
        </div>
        <div className="topbar-divider" />
        <h1 className="topbar-heading">SignVoice Real-Time Communication</h1>
      </div>
      <div className="topbar-right">
        <div className="topbar-metric">
          <span className="topbar-metric-label">STATUS</span>
          <span className="topbar-metric-value topbar-metric-value--live">ONLINE</span>
        </div>
        <div className="topbar-metric">
          <span className="topbar-metric-label">MODE</span>
          <span className="topbar-metric-value">TWO-WAY DUPLEX</span>
        </div>
      </div>
    </header>
  )
}
