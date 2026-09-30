import React, { useState, useEffect } from 'react'
import { getSessions, subscribeSessions } from '../services/sessionStore.js'
import { getFriendsData, subscribeFriends } from '../services/friendStore.js'
import { getMessages } from '../services/conversationStore.js'
import { getProfile, subscribeProfile } from '../services/profileStore.js'
import Aurora from '../components/Aurora.jsx'
import { GlowActionButton } from '../components/GlowEffect.jsx'

export default function DashboardView({ onNavigate, onCreateMeeting }) {
  const [sessions, setSessions] = useState(getSessions())
  const [friendsData, setFriendsData] = useState(getFriendsData())
  const [liveMsgCount, setLiveMsgCount] = useState(getMessages().length)
  const [profile, setProfile] = useState(getProfile())

  useEffect(() => {
    const unsubSess = subscribeSessions(setSessions)
    const unsubFriends = subscribeFriends(setFriendsData)
    const unsubProfile = subscribeProfile(setProfile)
    const id = setInterval(() => {
      setLiveMsgCount(getMessages().length)
    }, 1000)
    return () => {
      unsubSess()
      unsubFriends()
      unsubProfile()
      clearInterval(id)
    }
  }, [])

  const onlineFriends = friendsData.friends.filter((f) => f.status === 'online')
  const firstName = profile.name ? profile.name.split(' ')[0] : (profile.username || 'User')

  return (
    <div className="view-container dashboard-view">
      {/* Hero Welcome Banner with Aurora WebGL Shader Background */}
      <div className="dashboard-hero">
        <Aurora
          colorStops={["#DDD0C8", "#8C7B70", "#F3EEE8"]}
          blend={0.6}
          amplitude={0.7}
          speed={0.35}
        />
        <div className="dashboard-hero__content">
          <div className="dashboard-hero__badge">
            <span className="hero-dot" />
            <span>Multimodal Communication AI</span>
          </div>
          <h2 className="dashboard-hero__title">
            Good morning, {firstName}.
          </h2>
          <p className="dashboard-hero__desc">
            Communicate naturally. Sign, speak, and connect seamlessly with real-time gesture recognition and voice synthesis.
          </p>
          <div className="dashboard-hero__actions">
            <GlowActionButton
              variant="primary"
              onClick={onCreateMeeting}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            >
              Start Meeting
            </GlowActionButton>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate('sign-speak')}
              style={{ fontWeight: 600 }}
            >
              <span>Start Communication</span>
            </button>
            
            <GlowActionButton
              variant="secondary"
              onClick={() => onNavigate('sessions')}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            >
              View History
            </GlowActionButton>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid">
        <div className="metric-card">
          <div className="metric-card__header">
            <span className="metric-icon">💬</span>
            <span className="metric-tag">Live Session</span>
          </div>
          <div className="metric-card__value">{liveMsgCount}</div>
          <div className="metric-card__label">Active Messages Transcribed</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__header">
            <span className="metric-icon">👥</span>
            <span className="metric-tag">Network</span>
          </div>
          <div className="metric-card__value">{onlineFriends.length}</div>
          <div className="metric-card__label">Friends Online Now</div>
        </div>

        <div className="metric-card">
          <div className="metric-card__header">
            <span className="metric-icon">📁</span>
            <span className="metric-tag">History</span>
          </div>
          <div className="metric-card__value">{sessions.length}</div>
          <div className="metric-card__label">Saved Sessions</div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="dashboard-columns">
        {/* Left Column: Quick Actions & Friends Online */}
        <div className="dashboard-col">
          <div className="card-panel">
            <h3 className="card-panel__title">Quick Actions</h3>
            <div className="quick-actions-grid">
              <button
                type="button"
                className="action-tile"
                onClick={() => onNavigate('sign-speak')}
              >
                <span className="action-tile__icon">🤟</span>
                <span className="action-tile__label">Sign & Speak Mode</span>
              </button>
              <button
                type="button"
                className="action-tile"
                onClick={() => onNavigate('friends')}
              >
                <span className="action-tile__icon">👋</span>
                <span className="action-tile__label">Message a Friend</span>
              </button>
              <button
                type="button"
                className="action-tile"
                onClick={() => onNavigate('profile')}
              >
                <span className="action-tile__icon">⚙️</span>
                <span className="action-tile__label">Edit Profile</span>
              </button>
            </div>
          </div>

          <div className="card-panel">
            <div className="card-panel__header-row">
              <h3 className="card-panel__title">Online Contacts</h3>
              <button
                type="button"
                className="btn-link"
                onClick={() => onNavigate('friends')}
              >
                View all →
              </button>
            </div>
            <div className="friends-list-mini">
              {onlineFriends.map((friend) => (
                <div key={friend.id} className="friend-row-mini">
                  <div className="avatar-sm">
                    {friend.avatar}
                    <span className="status-dot status-dot--online" />
                  </div>
                  <div className="friend-info-mini">
                    <span className="friend-name">{friend.name}</span>
                    <span className="friend-role">{friend.role}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-pill-small"
                    onClick={() => onNavigate('sign-speak')}
                  >
                    Call
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Sessions Overview */}
        <div className="dashboard-col">
          <div className="card-panel">
            <div className="card-panel__header-row">
              <h3 className="card-panel__title">Recent Session Log</h3>
              <button
                type="button"
                className="btn-link"
                onClick={() => onNavigate('sessions')}
              >
                All sessions →
              </button>
            </div>
            <div className="sessions-list-mini">
              {sessions.slice(0, 3).map((sess) => (
                <div key={sess.id} className="session-card-mini">
                  <div className="session-card-mini__top">
                    <span className="session-title">{sess.title}</span>
                    <span className="session-date">{sess.date}</span>
                  </div>
                  <p className="session-preview">"{sess.preview}"</p>
                  <div className="session-card-mini__meta">
                    <span className="meta-tag">{sess.messagesCount} msgs</span>
                    <span className="meta-tag">{sess.duration}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
