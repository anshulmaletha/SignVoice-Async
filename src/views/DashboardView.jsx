import React, { useState, useEffect } from 'react'
import { getSessions, subscribeSessions } from '../services/sessionStore.js'
import { getFriendsData, subscribeFriends } from '../services/friendStore.js'
import { getMessages } from '../services/conversationStore.js'
import Aurora from '../components/Aurora.jsx'

export default function DashboardView({ onNavigate }) {
  const [sessions, setSessions] = useState(getSessions())
  const [friendsData, setFriendsData] = useState(getFriendsData())
  const [liveMsgCount, setLiveMsgCount] = useState(getMessages().length)

  useEffect(() => {
    const unsubSess = subscribeSessions(setSessions)
    const unsubFriends = subscribeFriends(setFriendsData)
    const id = setInterval(() => {
      setLiveMsgCount(getMessages().length)
    }, 1000)
    return () => {
      unsubSess()
      unsubFriends()
      clearInterval(id)
    }
  }, [])

  const onlineFriends = friendsData.friends.filter((f) => f.status === 'online')

  return (
    <div className="view-container dashboard-view">
      {/* Hero Welcome Banner with Aurora WebGL Shader Background */}
      <div className="dashboard-hero">
        <Aurora
          colorStops={["#DDD0C8", "#323232", "#8FA68A"]}
          blend={0.5}
          amplitude={0.8}
          speed={0.4}
        />
        <div className="dashboard-hero__content">
          <div className="dashboard-hero__badge">
            <span className="hero-dot" />
            <span>Real-Time Two-Way Communication</span>
          </div>
          <h2 className="dashboard-hero__title">
            Sign Language <span className="text-amber">meets</span> Voice Speech
          </h2>
          <p className="dashboard-hero__desc">
            Bridge the gap instantly. Use your webcam for optical gesture tracking and microphone for speech synthesis in simultaneous duplex mode.
          </p>
          <div className="dashboard-hero__actions">
            <button
              type="button"
              className="btn-primary-glow"
              onClick={() => onNavigate('sign-speak')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Start Communication Session</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => onNavigate('sessions')}
            >
              <span>View Past Transcripts</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card" onClick={() => onNavigate('sign-speak')} role="button" tabIndex={0}>
          <div className="metric-card__header">
            <span className="metric-card__label">Active Workspace</span>
            <span className="metric-card__icon text-amber">👁️</span>
          </div>
          <div className="metric-card__value">
            {liveMsgCount > 0 ? `${liveMsgCount} Messages` : 'Standby'}
          </div>
          <div className="metric-card__sub">
            {liveMsgCount > 0 ? 'Live communication active' : 'Click to launch camera & mic'}
          </div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('sessions')} role="button" tabIndex={0}>
          <div className="metric-card__header">
            <span className="metric-card__label">Saved Sessions</span>
            <span className="metric-card__icon text-terracotta">📁</span>
          </div>
          <div className="metric-card__value">{sessions.length}</div>
          <div className="metric-card__sub">Archived conversation transcripts</div>
        </div>

        <div className="metric-card" onClick={() => onNavigate('friends')} role="button" tabIndex={0}>
          <div className="metric-card__header">
            <span className="metric-card__label">Connected Friends</span>
            <span className="metric-card__icon text-success">👥</span>
          </div>
          <div className="metric-card__value">{onlineFriends.length} Online</div>
          <div className="metric-card__sub">{friendsData.friends.length} contacts available</div>
        </div>
      </div>

      {/* 2-Column Content Grid: Recent Sessions & Quick Contacts */}
      <div className="dashboard-content-grid">
        {/* Recent Sessions */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__title-wrap">
              <span className="dash-card__icon">🕒</span>
              <h3 className="dash-card__title">Recent Sessions</h3>
            </div>
            <button
              type="button"
              className="dash-link-btn"
              onClick={() => onNavigate('sessions')}
            >
              See All →
            </button>
          </div>
          <div className="dash-sessions-list">
            {sessions.slice(0, 3).map((sess) => (
              <div
                key={sess.id}
                className="dash-session-row"
                onClick={() => onNavigate('sessions')}
                role="button"
                tabIndex={0}
              >
                <div className="dash-session-main">
                  <span className="dash-session-title">{sess.title}</span>
                  <span className="dash-session-meta">
                    {new Date(sess.startedAt).toLocaleDateString()} • {sess.messageCount} messages
                  </span>
                </div>
                <span className="dash-session-badge">View Transcript</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts & Quick Connect */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__title-wrap">
              <span className="dash-card__icon">🤝</span>
              <h3 className="dash-card__title">Friends & Contacts</h3>
            </div>
            <button
              type="button"
              className="dash-link-btn"
              onClick={() => onNavigate('friends')}
            >
              Manage →
            </button>
          </div>
          <div className="dash-friends-list">
            {friendsData.friends.slice(0, 4).map((friend) => (
              <div key={friend.id} className="dash-friend-row">
                <div className="dash-friend-left">
                  <div className="dash-friend-avatar">
                    <span>{friend.avatar}</span>
                    <span className={`status-indicator status-indicator--${friend.status}`} />
                  </div>
                  <div className="dash-friend-info">
                    <span className="dash-friend-name">{friend.name}</span>
                    <span className="dash-friend-role">{friend.role}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="dash-connect-btn"
                  onClick={() => onNavigate('sign-speak')}
                  title="Start Session"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
