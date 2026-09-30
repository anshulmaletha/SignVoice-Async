import React, { useState } from 'react'
import signvoiceLogo from '../assets/signvoice-logo.jpg'
import { setActiveProfile } from '../services/profileStore.js'
import Particles from '../components/Particles.jsx'

const DEMO_ACCOUNTS = [
  { username: 'Anshul', password: 'anshul123' },
  { username: 'Aarya', password: 'aarya123' },
  { username: 'Radhika', password: 'radhika123' },
  { username: 'NeuraX', password: 'signvoice123' }
]

export default function LoginView({ onLoginSuccess, onBackToLanding }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMessage('')

    const cleanUser = username.trim()
    const matched = DEMO_ACCOUNTS.find(
      (acc) =>
        acc.username.toLowerCase() === cleanUser.toLowerCase() &&
        acc.password === password
    )

    if (matched) {
      try {
        sessionStorage.setItem('signvoice_auth', 'true')
      } catch (_) {}
      setActiveProfile(matched.username)
      if (onLoginSuccess) {
        onLoginSuccess(matched.username)
      }
    } else {
      setErrorMessage('Invalid username or password.')
    }
  }

  return (
    <div className="login-root">
      {/* 800 particle ambient background animation with full viewport distribution */}
      <Particles
        particleCount={800}
        speed={0.25}
        particleBaseSize={55}
        moveParticlesOnHover={true}
        particleHoverFactor={0.3}
        alphaParticles={true}
        disableRotation={false}
        particleColors={['#8C7B70', '#A99A91', '#DDD0C8']}
      />

      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="brand-logo-badge">
            <img
              src={signvoiceLogo}
              alt="SignVoice"
              className="brand-logo-img"
              height="40"
            />
          </div>
        </div>

        <div className="eyebrow-text login-eyebrow">SIGNVOICE AI</div>
        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">
          Sign in to continue to your SignVoice conversation.
        </p>

        {/* Inline Error Message */}
        {errorMessage && (
          <div className="login-error-banner" aria-live="polite" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Semantic Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-group">
            <label htmlFor="login-username" className="login-label">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              className="login-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Anshul, Aarya, Radhika, NeuraX"
              autoComplete="username"
              required
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="login-password" className="login-label">
              Password
            </label>
            <div className="password-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="login-input login-input--password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-7-11-7a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 7 11 7a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-pill btn-login-submit">
            <span>Sign In</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </form>

        {/* Demo Accounts Quick Guide */}
        <div className="demo-accounts-hint">
          <span className="demo-hint-title">Demo Accounts:</span>
          <div className="demo-hint-grid">
            <span><strong>Anshul</strong> / anshul123</span>
            <span><strong>Aarya</strong> / aarya123</span>
            <span><strong>Radhika</strong> / radhika123</span>
            <span><strong>NeuraX</strong> / signvoice123</span>
          </div>
        </div>

        <div className="login-footer-link">
          <button
            type="button"
            className="btn-back-landing"
            onClick={onBackToLanding}
          >
            ← Back to SignVoice
          </button>
        </div>
      </div>
    </div>
  )
}
