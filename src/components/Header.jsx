import React, { useState, useEffect } from 'react'
import { AnimatedBackground } from './AnimatedBackground.jsx'
import { getSettings, updateSettings, subscribeSettings } from '../services/settingsStore.js'

export default function Header({ activeNav = 'dashboard', onNavigate, onNavigateLanding }) {
  const [settings, setSettings] = useState(getSettings())

  useEffect(() => {
    const unsub = subscribeSettings(setSettings)
    return unsub
  }, [])

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
    { id: 'sign-speak', label: 'Sign & Speak', icon: 'camera' },
    { id: 'sessions', label: 'Sessions', icon: 'clock' },
    { id: 'friends', label: 'Friends', icon: 'users' },
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ]

  const toggleTheme = () => {
    updateSettings({ darkMode: !settings.darkMode })
  }

  return (
    <header className="top-navbar" aria-label="Top Navigation Bar">
      {/* LEFT: Brand Header */}
      <div
        className="topnav-brand"
        onClick={() => onNavigateLanding ? onNavigateLanding() : (onNavigate && onNavigate('dashboard'))}
        role="button"
        tabIndex={0}
        title="Return to Landing Page"
      >
        <div className="topnav-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="topnav-logo-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </div>
        <div className="topnav-brand-text">
          <span className="topnav-brand-name">
            <span className="wordmark-sign">Sign</span>
            <span className="wordmark-voice">Voice</span>
          </span>
          <span className="topnav-brand-sub">MULTIMODAL AI</span>
        </div>
      </div>

      {/* CENTER: Horizontal Floating Animated Navigation Capsule */}
      <nav className="topnav-menu" aria-label="Main Floating Navigation">
        <AnimatedBackground
          value={activeNav}
          onValueChange={(id) => onNavigate && onNavigate(id)}
          className="topnav-animated-nav"
          enableHover={true}
        >
          {navItems.map((item) => {
            const isActive = item.id === activeNav
            return (
              <button
                key={item.id}
                data-id={item.id}
                type="button"
                className={`topnav-link ${isActive ? 'topnav-link--active' : ''}`}
                onClick={() => onNavigate && onNavigate(item.id)}
              >
                <span className="topnav-link-icon" aria-hidden="true">
                  {item.icon === 'grid' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                  )}
                  {item.icon === 'camera' && (
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
                  {item.icon === 'user' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {item.icon === 'settings' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </AnimatedBackground>
      </nav>

      {/* RIGHT: Theme Toggle, Online Status & Profile Pill */}
      <div className="topnav-right">
        <button
          type="button"
          className="topnav-icon-btn"
          onClick={toggleTheme}
          title={settings.darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle Theme"
        >
          {settings.darkMode ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="topnav-btn-icon">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="topnav-btn-icon">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <div className="topnav-status">
          <span className="topnav-status-dot" />
          <span className="topnav-status-text">Online</span>
        </div>

        <div
          className="topnav-profile-pill"
          onClick={() => onNavigate && onNavigate('profile')}
          role="button"
          tabIndex={0}
          title="Open Profile"
        >
          <div className="topnav-avatar">AM</div>
          <span className="topnav-username">Anshul</span>
        </div>
      </div>
    </header>
  )
}
