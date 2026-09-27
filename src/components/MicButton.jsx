import React from 'react'

export default function MicButton({ isListening, status = 'idle', onToggle }) {
  const label = !isListening
    ? 'Start Microphone'
    : status === 'muted'
    ? 'Echo Suppressed'
    : status === 'processing'
    ? 'Processing...'
    : 'Listening...'

  return (
    <button
      type="button"
      className={`mic-button ${isListening ? 'mic-button--listening' : ''} ${
        status === 'processing' ? 'mic-button--processing' : ''
      } ${status === 'muted' ? 'mic-button--muted' : ''}`}
      onClick={onToggle}
      aria-label={label}
    >
      <span className="mic-button__icon-wrap">
        {!isListening ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mic-svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        ) : status === 'muted' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mic-svg">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16.95A7 7 0 015 12v-2m14 0v2a6.97 6.97 0 01-1.1 3.7" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        ) : (
          <span className="mic-pulse-dot" />
        )}
      </span>
      <span className="mic-button__label">{label}</span>
      {isListening && status !== 'muted' && (
        <span className="mic-button__waves" aria-hidden="true">
          <span className="wave-bar wave-bar--1" />
          <span className="wave-bar wave-bar--2" />
          <span className="wave-bar wave-bar--3" />
          <span className="wave-bar wave-bar--4" />
        </span>
      )}
    </button>
  )
}
