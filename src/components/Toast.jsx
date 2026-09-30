import React, { useState, useEffect } from 'react'

export default function Toast() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const handleToast = (e) => {
      if (e.detail && e.detail.message) {
        setToast(e.detail.message)
      }
    }

    window.addEventListener('signvoice:show-toast', handleToast)
    return () => window.removeEventListener('signvoice:show-toast', handleToast)
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  if (!toast) return null

  return (
    <div
      className="toast-container"
      role="status"
      aria-live="polite"
    >
      <div className="toast-card">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="toast-icon" width="18" height="18">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span className="toast-message">{toast}</span>
      </div>
    </div>
  )
}
