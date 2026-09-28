import React, { useEffect, useRef } from 'react'

export default function LandingModal({ isOpen, activeTab, onTabChange, onClose, onGetStarted, triggerRef }) {
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

  // Focus restoration to trigger element on close
  useEffect(() => {
    if (!isOpen && triggerRef && triggerRef.current) {
      triggerRef.current.focus()
    }
  }, [isOpen, triggerRef])

  // Initial focus inside modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const firstBtn = modalRef.current.querySelector('button')
      if (firstBtn) firstBtn.focus()
    }
  }, [isOpen, activeTab])

  if (!isOpen) return null

  const getHeaderEyebrow = () => {
    switch (activeTab) {
      case 'about': return 'ABOUT SIGNVOICE'
      case 'how-it-works': return 'HOW IT WORKS'
      case 'features': return 'PLATFORM FEATURES'
      default: return 'SIGNVOICE'
    }
  }

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'about': return 'Communication without barriers.'
      case 'how-it-works': return 'Real-Time Gesture & Speech Pipeline'
      case 'features': return 'Everything you need to connect.'
      default: return 'Communication without barriers.'
    }
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-container" ref={modalRef}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="eyebrow-text modal-eyebrow">{getHeaderEyebrow()}</div>
            <h2 id="modal-title" className="modal-title">{getHeaderTitle()}</h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 3 Tabs Header */}
        <div className="modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'about'}
            className={`modal-tab-btn ${activeTab === 'about' ? 'modal-tab-btn--active' : ''}`}
            onClick={() => onTabChange('about')}
          >
            About
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'how-it-works'}
            className={`modal-tab-btn ${activeTab === 'how-it-works' ? 'modal-tab-btn--active' : ''}`}
            onClick={() => onTabChange('how-it-works')}
          >
            How It Works
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'features'}
            className={`modal-tab-btn ${activeTab === 'features' ? 'modal-tab-btn--active' : ''}`}
            onClick={() => onTabChange('features')}
          >
            Features
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body">
          {activeTab === 'about' && (
            <div className="modal-tab-content">
              <p className="modal-paragraph">
                SignVoice connects people who sign with people who speak. Using your camera and microphone, it turns hand gestures into spoken voice and speech into text, so a conversation can flow naturally in both directions.
              </p>
              
              <h3 className="modal-section-title">Who it's for</h3>
              <div className="who-its-for-grid">
                <div className="who-card">
                  <svg className="who-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Deaf and hard-of-hearing people</span>
                </div>
                <div className="who-card">
                  <svg className="who-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Families and friends</span>
                </div>
                <div className="who-card">
                  <svg className="who-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>Classrooms</span>
                </div>
                <div className="who-card">
                  <svg className="who-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V9a2 2 0 012-2h2a2 2 0 012 2v12m-6 0v-4a2 2 0 012-2h2a2 2 0 012 2v4" />
                  </svg>
                  <span>Workplaces and service desks</span>
                </div>
              </div>

              <div className="belief-line">
                More inclusion. More connection. A brighter future.
              </div>
            </div>
          )}

          {activeTab === 'how-it-works' && (
            <div className="modal-tab-content">
              <div className="steps-list">
                <div className="step-card-item">
                  <div className="step-num-badge">1</div>
                  <div className="step-card-content">
                    <h4 className="step-card-title">Sign</h4>
                    <p className="step-card-desc">your camera captures your hand gestures and AI tracks your hands.</p>
                  </div>
                </div>

                <div className="step-card-item">
                  <div className="step-num-badge">2</div>
                  <div className="step-card-content">
                    <h4 className="step-card-title">AI Processing</h4>
                    <p className="step-card-desc">the model understands your intent and shows a confidence score.</p>
                  </div>
                </div>

                <div className="step-card-item">
                  <div className="step-num-badge">3</div>
                  <div className="step-card-content">
                    <h4 className="step-card-title">Voice</h4>
                    <p className="step-card-desc">the message is spoken aloud in real time with text-to-speech.</p>
                  </div>
                </div>

                <div className="step-card-item">
                  <div className="step-num-badge">4</div>
                  <div className="step-card-content">
                    <h4 className="step-card-title">Reply</h4>
                    <p className="step-card-desc">the other person answers by voice, and their words appear as text on your screen.</p>
                  </div>
                </div>
              </div>

              <p className="how-closing-note">
                Everything lands in one shared live conversation.
              </p>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="modal-tab-content">
              <div className="features-cards-grid">
                <div className="feature-grid-card">
                  <h4 className="feature-card-title">Sign to Speech</h4>
                  <p className="feature-card-desc">hand gestures become spoken voice.</p>
                </div>

                <div className="feature-grid-card">
                  <h4 className="feature-card-title">Speech to Text</h4>
                  <p className="feature-card-desc">live transcription while the person is still talking.</p>
                </div>

                <div className="feature-grid-card">
                  <h4 className="feature-card-title">Real-Time Conversation</h4>
                  <p className="feature-card-desc">one feed showing both sides.</p>
                </div>

                <div className="feature-grid-card">
                  <h4 className="feature-card-title">Confidence Score</h4>
                  <p className="feature-card-desc">see how sure the AI is about each sign.</p>
                </div>

                <div className="feature-grid-card">
                  <h4 className="feature-card-title">Two-Way Mode</h4>
                  <p className="feature-card-desc">sign and speak at the same time.</p>
                </div>

                <div className="feature-grid-card">
                  <h4 className="feature-card-title">Session History</h4>
                  <p className="feature-card-desc">revisit past conversations.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn-pill"
            onClick={() => {
              onClose()
              onGetStarted()
            }}
          >
            <span>Get Started</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
