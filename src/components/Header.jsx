import React, { useState, useEffect, useRef } from 'react'
import { AnimatedBackground } from './AnimatedBackground.jsx'
import { getSettings, updateSettings, subscribeSettings } from '../services/settingsStore.js'
import CopyButton from './CopyButton.jsx'
import signvoiceLogo from '../assets/signvoice-logo.jpg'

export default function Header({ activeNav = 'dashboard', onNavigate, onNavigateLanding, onLogout, onOpenImportantInfo }) {
  const [settings, setSettings] = useState(getSettings())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const unsub = subscribeSettings(setSettings)
    return unsub
  }, [])

  // Close mobile menu on outside click or Esc key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen])

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

  const handleNavClick = (id) => {
    if (onNavigate) onNavigate(id)
    setMobileMenuOpen(false)
  }

  return (
    <header className="top-navbar" aria-label="Top Navigation Bar" ref={menuRef}>
      {/* LEFT: Brand Header & Meeting Share Badge */}
      <div className="topnav-left-wrap">
        <div
          className="topnav-brand"
          onClick={() => onNavigateLanding ? onNavigateLanding() : (onNavigate && onNavigate('dashboard'))}
          role="button"
          tabIndex={0}
          title="Return to Landing Page"
          aria-label="SignVoice Home"
        >
          <div className="brand-logo-badge">
            <img
              src={signvoiceLogo}
              alt="SignVoice"
              className="brand-logo-img"
              height="40"
            />
          </div>
        </div>

        {/* Reusable Meeting ID Share Pill with Copy Button */}
        <div className="topnav-meeting-pill" title="Current Meeting Session ID">
          <span className="meeting-pill-tag">MEETING ID</span>
          <span className="meeting-pill-id">ABC-12345</span>
          <CopyButton
            textToCopy="ABC-12345"
            label="Copy ID"
            toastMessage="Meeting ID copied!"
            iconOnly={true}
            className="meeting-copy-btn"
          />
        </div>
      </div>

      {/* CENTER: Horizontal Floating Navigation Capsule (Desktop) */}
      <nav className="topnav-menu topnav-menu--desktop" aria-label="Main Floating Navigation">
        <AnimatedBackground
          value={activeNav}
          onValueChange={handleNavClick}
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
                onClick={() => handleNavClick(item.id)}
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

      {/* RIGHT: Important Information Button, Theme Toggle, Online Status & Profile Pill */}
      <div className="topnav-right">
        {/* Important Information Trigger Button */}
        {onOpenImportantInfo && (
          <button
            type="button"
            className="topnav-icon-btn"
            onClick={onOpenImportantInfo}
            title="Important Information"
            aria-label="Important Information"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="topnav-btn-icon" width="18" height="18">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        )}

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

        {onLogout && (
          <button
            type="button"
            className="topnav-logout-btn"
            onClick={onLogout}
            title="Log Out"
            aria-label="Log Out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log out</span>
          </button>
        )}

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="topnav-mobile-hamburger"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-app-menu"
          aria-label="Toggle Navigation Menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            {mobileMenuOpen ? (
              <line x1="18" y1="6" x2="6" y2="18" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* MOBILE APP MENU DRAWER */}
      {mobileMenuOpen && (
        <div id="mobile-app-menu" className="topnav-mobile-drawer">
          <ul className="mobile-drawer-list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`mobile-drawer-btn ${item.id === activeNav ? 'mobile-drawer-btn--active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}
