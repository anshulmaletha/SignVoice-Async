import React, { useState, useEffect } from 'react'
import { getProfile, updateProfile, subscribeProfile } from '../services/profileStore.js'

export default function ProfileView({ onNavigate }) {
  const [profile, setProfile] = useState(getProfile())
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    const unsub = subscribeProfile((updated) => {
      setProfile(updated)
      setFormData(updated)
    })
    return unsub
  }, [])

  function handleChange(field, val) {
    setFormData((prev) => ({ ...prev, [field]: val }))
  }

  function handleSave(e) {
    e.preventDefault()
    updateProfile(formData)
    setIsEditing(false)
    setFeedback('Profile updated successfully')
    setTimeout(() => setFeedback(''), 2000)
  }

  return (
    <div className="view-container profile-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">User Profile</h2>
          <p className="view-subtitle">Manage your personal identity, communication preferences, and account settings.</p>
        </div>
        {feedback && (
          <span className="profile-saved-badge">✓ {feedback}</span>
        )}
      </div>

      {/* Main Profile Hero Card */}
      <div className="profile-hero-card">
        <div className="profile-hero__top">
          <div className="profile-avatar-lg">
            <span>{profile.avatar}</span>
            <span className="status-badge-dot status-badge-dot--online" />
          </div>
          <div className="profile-hero__info">
            <h3 className="profile-hero__name">{profile.name}</h3>
            <span className="profile-hero__handle">@{profile.username}</span>
            <div className="profile-pills-row">
              <span className="profile-role-pill">{profile.role}</span>
              <span className="profile-status-pill">● {profile.status}</span>
            </div>
          </div>
          <button
            type="button"
            className={isEditing ? 'btn-secondary-small' : 'btn-primary-small'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
        <p className="profile-hero__bio">{profile.bio}</p>
      </div>

      {/* Details & Preferences Form */}
      <form onSubmit={handleSave} className="profile-sections-grid">
        {/* Account Details Card */}
        <div className="profile-card">
          <div className="profile-card__header">
            <span className="profile-card__icon">👤</span>
            <h4 className="profile-card__title">Account Details</h4>
          </div>
          <div className="profile-card__body">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              ) : (
                <div className="form-static-val">{profile.name}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Username</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                />
              ) : (
                <div className="form-static-val">@{profile.username}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  className="form-input"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              ) : (
                <div className="form-static-val">{profile.email}</div>
              )}
            </div>
          </div>
        </div>

        {/* Communication Preferences Card */}
        <div className="profile-card">
          <div className="profile-card__header">
            <span className="profile-card__icon">🤟</span>
            <h4 className="profile-card__title">Communication Preferences</h4>
          </div>
          <div className="profile-card__body">
            <div className="form-group">
              <label className="form-label">Preferred Communication Mode</label>
              {isEditing ? (
                <select
                  className="form-select"
                  value={formData.preferredMode}
                  onChange={(e) => handleChange('preferredMode', e.target.value)}
                >
                  <option value="Multimodal (Sign + Speech)">Multimodal (Sign + Speech)</option>
                  <option value="Visual Sign Preferred">Visual Sign Preferred</option>
                  <option value="Voice Speech Preferred">Voice Speech Preferred</option>
                </select>
              ) : (
                <div className="form-static-val">{profile.preferredMode}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Primary Language</label>
              {isEditing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.primaryLanguage}
                  onChange={(e) => handleChange('primaryLanguage', e.target.value)}
                />
              ) : (
                <div className="form-static-val">{profile.primaryLanguage}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Bio Note</label>
              {isEditing ? (
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                />
              ) : (
                <div className="form-static-val">{profile.bio}</div>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="profile-actions-bar">
            <button type="button" className="btn-ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary-glow">
              Save Profile Changes
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
