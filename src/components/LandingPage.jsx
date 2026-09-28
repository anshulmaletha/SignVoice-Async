import React, { useState, useEffect, useRef } from 'react'
import '../styles/landing.css'
import LandingModal from './LandingModal.jsx'
import signvoiceLogo from '../assets/signvoice-logo.jpg'

export default function LandingPage({ onGetStarted }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState('about')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const triggerRef = useRef(null)

  // Support Deep Links (#about, #how-it-works, #features)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (['about', 'how-it-works', 'features'].includes(hash)) {
        setModalTab(hash)
        setModalOpen(true)
      }
    }

    // Check initial hash on load
    handleHashChange()

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const openModal = (tab, refTarget) => {
    if (refTarget) triggerRef.current = refTarget
    setModalTab(tab)
    setModalOpen(true)
    window.history.pushState(null, '', `#${tab}`)
  }

  const closeModal = () => {
    setModalOpen(false)
    if (window.location.hash) {
      window.history.pushState(null, '', window.location.pathname)
    }
  }

  return (
    <div className="landing-root">
      {/* 1. Navigation Bar */}
      <nav className="landing-nav" aria-label="Main Landing Navigation">
        <button
          type="button"
          className="landing-logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="SignVoice Home"
        >
          <div className="brand-logo-badge">
            <img
              src={signvoiceLogo}
              alt="SignVoice"
              className="brand-logo-img"
              height="40"
            />
          </div>
        </button>

        {/* Desktop Links */}
        <ul className={`landing-nav-links ${mobileMenuOpen ? 'landing-nav-links--mobile-open' : ''}`}>
          <li>
            <button
              type="button"
              className="landing-nav-link"
              onClick={(e) => openModal('about', e.currentTarget)}
            >
              About
            </button>
          </li>
          <li>
            <button
              type="button"
              className="landing-nav-link"
              onClick={(e) => openModal('how-it-works', e.currentTarget)}
            >
              How It Works
            </button>
          </li>
          <li>
            <button
              type="button"
              className="landing-nav-link"
              onClick={(e) => openModal('features', e.currentTarget)}
            >
              Features
            </button>
          </li>
          <li>
            <button
              type="button"
              className="btn-pill"
              onClick={onGetStarted}
            >
              Get Started
            </button>
          </li>
        </ul>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="landing-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
            {mobileMenuOpen ? (
              <line x1="18" y1="6" x2="6" y2="18" />
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* 2. Hero Section */}
      <section className="landing-hero" aria-label="Hero Section">
        {/* Left Column */}
        <div className="hero-left">
          <div className="eyebrow-text hero-eyebrow">
            SIGN × SPEECH × CONNECTION
          </div>
          <h1 className="hero-title">
            <span className="wordmark-sign">Sign</span>
            <span className="wordmark-voice">Voice</span>
          </h1>
          <h2 className="hero-subhead">
            Communication without barriers.
          </h2>
          <p className="hero-description">
            SignVoice is an AI-powered communication platform that translates hand gestures and speech into understandable messages in real time.
          </p>
          <div className="hero-cta-wrap">
            <button
              type="button"
              className="btn-pill btn-hero-cta"
              onClick={onGetStarted}
            >
              <span>Get Started</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>

        {/* Right Column: 3D Artwork & 3-Step Pipeline Row */}
        <div className="hero-right">
          <div className="hero-art-container">
            <img
              src="/assets/hero-art.webp"
              alt="A hand gesture flowing into the SignVoice AI chip and out as sound waves"
              loading="eager"
              fetchpriority="high"
              className="hero-art-img"
            />
          </div>

          {/* 3-step row with dashed arrows over pedestal */}
          <div className="hero-pipeline-row" role="region" aria-label="SignVoice 3-Step Pipeline">
            <button
              type="button"
              className="pipeline-step-item"
              onClick={(e) => openModal('how-it-works', e.currentTarget)}
              title="Click to view Step 1 details"
            >
              <span className="pipeline-step-title">Sign</span>
              <span className="pipeline-step-desc">Captured by AI</span>
            </button>

            <svg className="pipeline-arrow" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h24m-4-4l4 4-4 4" />
            </svg>

            <button
              type="button"
              className="pipeline-step-item"
              onClick={(e) => openModal('how-it-works', e.currentTarget)}
              title="Click to view Step 2 details"
            >
              <span className="pipeline-step-title">AI Processing</span>
              <span className="pipeline-step-desc">Understands your intent</span>
            </button>

            <svg className="pipeline-arrow" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 8h24m-4-4l4 4-4 4" />
            </svg>

            <button
              type="button"
              className="pipeline-step-item"
              onClick={(e) => openModal('how-it-works', e.currentTarget)}
              title="Click to view Step 3 details"
            >
              <span className="pipeline-step-title">Voice</span>
              <span className="pipeline-step-desc">Spoken in real time</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Cream Feature Strip */}
      <section className="landing-feature-strip" aria-label="Feature Summary">
        {/* Column 1: Sign to Speech */}
        <button
          type="button"
          className="feature-col"
          onClick={(e) => openModal('features', e.currentTarget)}
        >
          <div className="feature-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          </div>
          <h3 className="feature-col-title">Sign to Speech</h3>
          <p className="feature-col-desc">
            Use hand gestures to communicate, and let SignVoice speak for you.
          </p>
        </button>

        {/* Column 2: Speech to Text */}
        <button
          type="button"
          className="feature-col"
          onClick={(e) => openModal('features', e.currentTarget)}
        >
          <div className="feature-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h3 className="feature-col-title">Speech to Text</h3>
          <p className="feature-col-desc">
            Speak naturally, and get accurate text translation in real time.
          </p>
        </button>

        {/* Column 3: Real-Time Conversation */}
        <button
          type="button"
          className="feature-col"
          onClick={(e) => openModal('features', e.currentTarget)}
        >
          <div className="feature-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="feature-col-title">Real-Time Conversation</h3>
          <p className="feature-col-desc">
            Bridging the gap between sign language and spoken communication.
          </p>
        </button>
      </section>

      {/* 4. Dark Bottom Band */}
      <footer className="landing-bottom-band" aria-label="Footer Tagline">
        <div className="bottom-band-curve" aria-hidden="true">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z" className="shape-fill"></path>
          </svg>
        </div>

        <div className="tagline-container">
          <div className="tagline-line" />
          <p className="eyebrow-text tagline-text">
            MORE INCLUSION / MORE CONNECTION / A BRIGHTER FUTURE
          </p>
          <div className="tagline-line" />
        </div>
      </footer>

      {/* Modal Dialog */}
      <LandingModal
        isOpen={modalOpen}
        activeTab={modalTab}
        onTabChange={(tab) => setModalTab(tab)}
        onClose={closeModal}
        onGetStarted={onGetStarted}
        triggerRef={triggerRef}
      />
    </div>
  )
}
