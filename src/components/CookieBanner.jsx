import React, { useState, useEffect } from 'react'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('signvoice_cookie_consent')
      if (!consent) {
        // Show after small delay for smooth entrance
        const timer = setTimeout(() => setVisible(true), 600)
        return () => clearTimeout(timer)
      }
    } catch (_) {
      // Fallback if localStorage is restricted
    }
  }, [])

  const handleChoice = (choice) => {
    try {
      localStorage.setItem('signvoice_cookie_consent', choice)
    } catch (_) {}
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      className="cookie-consent-banner"
      role="region"
      aria-label="Cookie Consent Notice"
    >
      <div className="cookie-banner-content">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="cookie-banner-icon" width="20" height="20">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
        <p className="cookie-banner-text">
          SignVoice uses cookies to remember preferences and improve your experience.
        </p>
      </div>

      <div className="cookie-banner-actions">
        <button
          type="button"
          className="btn-cookie btn-cookie--decline"
          onClick={() => handleChoice('declined')}
          aria-label="Decline non-essential cookies"
        >
          Decline
        </button>
        <button
          type="button"
          className="btn-cookie btn-cookie--accept"
          onClick={() => handleChoice('accepted')}
          aria-label="Accept cookies"
        >
          Accept
        </button>
      </div>
    </aside>
  )
}
