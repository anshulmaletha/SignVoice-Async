import React, { useState, useEffect } from 'react'
import {
  getFriendsData,
  subscribeFriends,
  addFriend,
  removeFriend,
  acceptRequest,
  rejectRequest,
} from '../services/friendStore.js'

export default function FriendsView({ onNavigate }) {
  const [data, setData] = useState(getFriendsData())
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('Signer')

  useEffect(() => {
    const unsub = subscribeFriends(setData)
    return unsub
  }, [])

  function handleAddSubmit(e) {
    e.preventDefault()
    if (!newName.trim()) return
    addFriend(newName, newRole)
    setNewName('')
    setShowAddModal(false)
  }

  const filteredFriends = data.friends.filter((f) => {
    const q = searchQuery.toLowerCase()
    return f.name.toLowerCase().includes(q) || f.role.toLowerCase().includes(q)
  })

  return (
    <div className="view-container friends-view">
      {/* Friends Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Friends & Contacts</h2>
          <p className="view-subtitle">Connect with sign language users and voice speakers for instant sessions.</p>
        </div>
        <button
          type="button"
          className="btn-primary-glow"
          onClick={() => setShowAddModal(true)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Add Friend</span>
        </button>
      </div>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add New Contact</h3>
              <button type="button" className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Contact Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Rivera"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Primary Communication Mode</label>
                <select
                  className="form-select"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="Signer">Signer (Visual/Gesture)</option>
                  <option value="Speaker">Speaker (Voice/Speech)</option>
                  <option value="Multimodal User">Multimodal (Both)</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-small">
                  Add Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="friends-search-bar">
        <div className="search-input-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search friends by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
      </div>

      {/* Pending Requests Section if any */}
      {data.requests && data.requests.length > 0 && (
        <div className="requests-section">
          <div className="section-label">Pending Requests ({data.requests.length})</div>
          <div className="requests-grid">
            {data.requests.map((req) => (
              <div key={req.id} className="request-card">
                <div className="request-card__info">
                  <div className="request-avatar">{req.avatar}</div>
                  <div>
                    <span className="request-name">{req.name}</span>
                    <span className="request-role">{req.role} • {req.sentAt}</span>
                  </div>
                </div>
                <div className="request-card__actions">
                  <button
                    type="button"
                    className="btn-accept"
                    onClick={() => acceptRequest(req.id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="btn-reject"
                    onClick={() => rejectRequest(req.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Grid */}
      <div className="friends-grid-section">
        <div className="section-label">All Contacts ({filteredFriends.length})</div>
        {filteredFriends.length === 0 ? (
          <div className="friends-empty-state">
            <span className="empty-icon">👥</span>
            <p>No contacts found.</p>
            <small>Click "Add Friend" to add communication partners.</small>
          </div>
        ) : (
          <div className="friends-cards-grid">
            {filteredFriends.map((f) => (
              <div key={f.id} className="friend-card">
                <div className="friend-card__top">
                  <div className="friend-avatar-wrap">
                    <div className="friend-avatar">{f.avatar}</div>
                    <span className={`status-badge-dot status-badge-dot--${f.status}`} />
                  </div>
                  <div className="friend-details">
                    <h4 className="friend-name">{f.name}</h4>
                    <span className="friend-role-badge">{f.role}</span>
                  </div>
                </div>

                <div className="friend-card__bottom">
                  <span className="friend-status-text">
                    {f.status === 'online' ? '● Available' : `○ ${f.lastActive}`}
                  </span>
                  <div className="friend-actions">
                    <button
                      type="button"
                      className="friend-connect-btn"
                      onClick={() => onNavigate('sign-speak')}
                      title="Start Session"
                    >
                      Connect
                    </button>
                    <button
                      type="button"
                      className="friend-remove-btn"
                      onClick={() => removeFriend(f.id)}
                      title="Remove contact"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
