import React from 'react'

export default function Sidebar({ activeNav = 'sign-speak', onNavClick }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'sign-speak', label: 'Sign & Speak', icon: 'camera-spark', active: true, badge: 'Live' },
    { id: 'sessions', label: 'Sessions', icon: 'clock' },
    { id: 'friends', label: 'Friends', icon: 'users' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      <div className="app-sidebar__top">
        {/* Brand Header */}
        <div className="app-sidebar__brand">
          <div className="brand-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="brand-icon" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">SignVoice</span>
            <span className="brand-sub">MULTIMODAL AI</span>
          </div>
        </div>

        {/* Start Session Action */}
        <button
          type="button"
          className="sidebar-quick-btn"
          onClick={() => {}}
          title="New Communication Session"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="quick-btn-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Start Session</span>
        </button>

        {/* Nav list */}
        <nav className="sidebar-nav">
          <span className="sidebar-section-title">Navigation</span>
          <ul className="sidebar-menu">
            {navItems.map((item) => {
              const isActive = item.id === activeNav
              return (
                <li key={item.id} className="sidebar-menu__item">
                  <button
                    type="button"
                    className={`sidebar-menu__link ${isActive ? 'sidebar-menu__link--active' : ''}`}
                    onClick={() => onNavClick && onNavClick(item.id)}
                  >
                    <span className="sidebar-menu__icon" aria-hidden="true">
                      {item.icon === 'grid' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" rx="1.5" />
                          <rect x="14" y="3" width="7" height="7" rx="1.5" />
                          <rect x="14" y="14" width="7" height="7" rx="1.5" />
                          <rect x="3" y="14" width="7" height="7" rx="1.5" />
                        </svg>
                      )}
                      {item.icon === 'camera-spark' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                      {item.icon === 'clock' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      )}
                      {item.icon === 'users' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      )}
                      {item.icon === 'settings' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </span>
                    <span className="sidebar-menu__label">{item.label}</span>
                    {item.badge && <span className="sidebar-menu__badge">{item.badge}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="app-sidebar__bottom">
        {/* System telemetry card */}
        <div className="sidebar-telemetry">
          <div className="sidebar-telemetry__header">
            <span className="sidebar-telemetry__dot" />
            <span className="sidebar-telemetry__status">ENGINES ACTIVE</span>
          </div>
          <div className="sidebar-telemetry__meta">
            <span>Latency</span>
            <span className="sidebar-telemetry__val">Real-time</span>
          </div>
        </div>

        {/* User profile */}
        <div className="sidebar-user">
          <div className="sidebar-user__avatar">
            <span>SV</span>
          </div>
          <div className="sidebar-user__info">
            <span className="sidebar-user__name">SignVoice User</span>
            <span className="sidebar-user__role">Connected</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
