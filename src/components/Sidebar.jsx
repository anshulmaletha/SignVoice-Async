import React, { useState, useEffect } from 'react'
import { getProfile, subscribeProfile } from '../services/profileStore.js'

export default function Sidebar({ activeNav = 'dashboard', onNavClick, collapsed = false }) {
  const [profile, setProfile] = useState(getProfile())

  useEffect(() => {
    const unsub = subscribeProfile(setProfile)
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

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`} aria-label="Main Navigation">
      {/* Navigation items list */}
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {navItems.map((item) => {
            const isActive = item.id === activeNav
            return (
              <li key={item.id} className="sidebar-menu__item">
                <button
                  type="button"
                  className={`sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
                  onClick={() => onNavClick && onNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="sidebar-link__icon">
                    {item.icon === 'grid' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="14" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
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
                  <span className="sidebar-link__label">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer user profile snippet */}
      <div className="sidebar-footer">
        <div
          className="sidebar-user"
          onClick={() => onNavClick && onNavClick('profile')}
          style={{ cursor: 'pointer' }}
          title="User Profile & Settings"
        >
          <div className="sidebar-user__avatar">
            <span>{profile.avatar || 'AM'}</span>
          </div>
          <div className="sidebar-user__info">
            <span className="sidebar-user__name">{profile.name || 'Anshul Maletha'}</span>
            <span className="sidebar-user__role">{profile.status || 'Connected'}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
