import React from 'react'

export default function Header({ activeNav = 'sign-speak' }) {
  const titles = {
    'dashboard': 'System Overview & Quick Start',
    'sign-speak': 'SignVoice Real-Time Communication',
    'sessions': 'Past Communication Transcripts',
    'friends': 'Contacts & Communication Partners',
    'settings': 'Hardware & Application Preferences',
  }

  const badgeLabels = {
    'dashboard': 'OVERVIEW',
    'sign-speak': 'LIVE SESSION',
    'sessions': 'ARCHIVE',
    'friends': 'DIRECTORY',
    'settings': 'PREFERENCES',
  }

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <div className="topbar-session-badge">
          <span className={`topbar-live-dot ${activeNav === 'sign-speak' ? 'topbar-live-dot--active' : ''}`} />
          <span className="topbar-session-title">{badgeLabels[activeNav] || 'ACTIVE'}</span>
        </div>
        <div className="topbar-divider" />
        <h1 className="topbar-heading">{titles[activeNav] || 'SignVoice'}</h1>
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
