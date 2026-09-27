import React, { useState, useEffect } from 'react'
import {
  getSessions,
  subscribeSessions,
  saveCurrentSession,
  deleteSession,
} from '../services/sessionStore.js'
import { getMessages } from '../services/conversationStore.js'

export default function SessionsView({ onNavigate }) {
  const [sessions, setSessions] = useState(getSessions())
  const [selectedSession, setSelectedSession] = useState(sessions[0] || null)
  const [currentLiveMessages, setCurrentLiveMessages] = useState(getMessages())
  const [sessionNameInput, setSessionNameInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const unsub = subscribeSessions((updated) => {
      setSessions(updated)
      if (selectedSession) {
        const found = updated.find((s) => s.id === selectedSession.id)
        setSelectedSession(found || updated[0] || null)
      } else if (updated.length > 0) {
        setSelectedSession(updated[0])
      }
    })
    return unsub
  }, [selectedSession])

  function handleSaveCurrent() {
    const title = sessionNameInput.trim() || `Session ${new Date().toLocaleDateString()}`
    const saved = saveCurrentSession(title)
    if (saved) {
      setSelectedSession(saved)
      setSessionNameInput('')
      setIsSaving(false)
    }
  }

  function handleDelete(id, e) {
    e.stopPropagation()
    deleteSession(id)
    if (selectedSession?.id === id) {
      const remaining = sessions.filter((s) => s.id !== id)
      setSelectedSession(remaining[0] || null)
    }
  }

  return (
    <div className="view-container sessions-view">
      {/* Sessions View Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Communication Sessions</h2>
          <p className="view-subtitle">Review, archive, and inspect past multi-modal conversation transcripts.</p>
        </div>
        <div className="view-header-actions">
          {currentLiveMessages.length > 0 && (
            <button
              type="button"
              className="btn-accent-save"
              onClick={() => setIsSaving(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save Active Session ({currentLiveMessages.length})</span>
            </button>
          )}
          <button
            type="button"
            className="btn-primary-glow"
            onClick={() => onNavigate('sign-speak')}
          >
            <span>+ New Live Session</span>
          </button>
        </div>
      </div>

      {/* Save Session Dialog */}
      {isSaving && (
        <div className="save-session-bar">
          <input
            type="text"
            className="save-session-input"
            placeholder="Enter session title (e.g. Morning Standup, Sign Practice)..."
            value={sessionNameInput}
            onChange={(e) => setSessionNameInput(e.target.value)}
            autoFocus
          />
          <button type="button" className="btn-primary-small" onClick={handleSaveCurrent}>
            Confirm Save
          </button>
          <button type="button" className="btn-ghost-small" onClick={() => setIsSaving(false)}>
            Cancel
          </button>
        </div>
      )}

      {/* 2-Column Sessions Layout: Left List, Right Transcript Details */}
      <div className="sessions-layout-grid">
        {/* Sessions List */}
        <div className="sessions-list-panel">
          <div className="panel-subhead">
            <span>All Sessions ({sessions.length})</span>
          </div>
          {sessions.length === 0 ? (
            <div className="sessions-empty-state">
              <span className="empty-icon">📁</span>
              <p>No saved sessions yet.</p>
              <small>Start a session in Sign & Speak to generate message logs.</small>
            </div>
          ) : (
            <div className="sessions-items-scroll">
              {sessions.map((sess) => {
                const isSelected = selectedSession?.id === sess.id
                return (
                  <div
                    key={sess.id}
                    className={`session-item-card ${isSelected ? 'session-item-card--active' : ''}`}
                    onClick={() => setSelectedSession(sess)}
                  >
                    <div className="session-item-main">
                      <div className="session-item-title-row">
                        <span className="session-item-title">{sess.title}</span>
                        <button
                          type="button"
                          className="session-delete-btn"
                          onClick={(e) => handleDelete(sess.id, e)}
                          title="Delete session"
                        >
                          ×
                        </button>
                      </div>
                      <div className="session-item-meta">
                        <span>{new Date(sess.startedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span className="meta-dot">•</span>
                        <span className="meta-count">{sess.messageCount} messages</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Selected Session Transcript */}
        <div className="session-transcript-panel">
          {selectedSession ? (
            <>
              <div className="transcript-header">
                <div>
                  <h3 className="transcript-title">{selectedSession.title}</h3>
                  <div className="transcript-meta">
                    <span>Started: {new Date(selectedSession.startedAt).toLocaleTimeString()}</span>
                    <span>Status: Completed</span>
                    <span>Total messages: {selectedSession.messages?.length || 0}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-ghost-small"
                  onClick={() => onNavigate('sign-speak')}
                >
                  Resume in Live Session →
                </button>
              </div>

              <div className="transcript-messages-scroll">
                {selectedSession.messages && selectedSession.messages.length > 0 ? (
                  selectedSession.messages.map((m) => {
                    const isSign = m.sender === 'sign_user' || m.type === 'sign'
                    return (
                      <div
                        key={m.id}
                        className={`conversation-message ${
                          isSign ? 'conversation-message--sign' : 'conversation-message--speech'
                        }`}
                      >
                        <div className="conversation-message__header">
                          <div className="conversation-message__sender-badge">
                            <span className="conversation-message__icon">
                              {isSign ? '🤟' : '🗣️'}
                            </span>
                            <span className="conversation-message__sender">
                              {isSign ? 'Sign Language' : 'Voice Speech'}
                            </span>
                          </div>
                          {m.timestamp && (
                            <span className="conversation-message__time">
                              {new Date(m.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <div className="conversation-message__text">{m.text}</div>
                      </div>
                    )
                  })
                ) : (
                  <div className="transcript-empty">No messages recorded in this session.</div>
                )}
              </div>
            </>
          ) : (
            <div className="transcript-unselected">
              <span className="empty-icon">📄</span>
              <p>Select a session on the left to review its transcript.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
