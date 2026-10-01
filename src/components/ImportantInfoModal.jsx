import React, { useEffect, useRef } from 'react'

const SUPPORTED_GESTURES = [
  { name: 'HELLO', desc: 'Greeting' },
  { name: 'YES', desc: 'Affirmation' },
  { name: 'NO', desc: 'Negation' },
  { name: 'HELP', desc: 'Assistance request' },
  { name: 'THANK_YOU', desc: 'Gratitude' },
  { name: 'STOP', desc: 'Halt action' },
  { name: 'WAIT', desc: 'Pause request' },
  { name: 'WATER', desc: 'Hydration request' },
  { name: 'FOOD', desc: 'Meal request' },
  { name: 'GOODBYE', desc: 'Farewell' },
  { name: 'PLEASE', desc: 'Polite request' },
  { name: 'SORRY', desc: 'Apology' },
]

export default function ImportantInfoModal({ isOpen, onClose }) {
  const modalRef = useRef(null)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Esc key listener & Focus Trapping
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return
        const focusables = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return

        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="info-dialog-title"
    >
      <div className="modal-container info-modal-container" ref={modalRef}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="eyebrow-text modal-eyebrow">ACCESSIBILITY & PLATFORM OVERVIEW</div>
            <h2 id="info-dialog-title" className="modal-title">Important Information</h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close information dialog"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body">
          <p className="modal-paragraph">
            SignVoice is an AI-powered assistive communication platform designed to help bridge communication between gesture/sign users and people who communicate through speech.
          </p>

          <h3 className="modal-section-title">How it works</h3>
          <div className="info-steps-grid">
            <div className="info-step-card">
              <span className="info-step-num">01</span>
              <div>
                <h4 className="info-step-title">SIGN</h4>
                <p className="info-step-desc">Hand gestures are captured in real time through your camera.</p>
              </div>
            </div>

            <div className="info-step-card">
              <span className="info-step-num">02</span>
              <div>
                <h4 className="info-step-title">AI PROCESSING</h4>
                <p className="info-step-desc">The neural system recognizes supported gestures and converts them into meaningful messages.</p>
              </div>
            </div>

            <div className="info-step-card">
              <span className="info-step-num">03</span>
              <div>
                <h4 className="info-step-title">VOICE</h4>
                <p className="info-step-desc">Recognized messages can be spoken aloud in real time using text-to-speech.</p>
              </div>
            </div>

            <div className="info-step-card">
              <span className="info-step-num">04</span>
              <div>
                <h4 className="info-step-title">SPEECH</h4>
                <p className="info-step-desc">Spoken communication from hearing partners is converted into live text captions.</p>
              </div>
            </div>
          </div>

          <h3 className="modal-section-title" style={{ marginTop: '24px' }}>Supported Gestures</h3>
          <div className="info-gestures-grid">
            {SUPPORTED_GESTURES.map((g) => (
              <div key={g.name} className="info-gesture-pill">
                <span className="gesture-name">{g.name.replace('_', ' ')}</span>
                <span className="gesture-desc">{g.desc}</span>
              </div>
            ))}
          </div>

          <div className="info-accessibility-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Accessibility Note:</strong> SignVoice is designed as an accessibility-focused prototype for real-time bi-directional communication.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-pill"
            onClick={onClose}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}
