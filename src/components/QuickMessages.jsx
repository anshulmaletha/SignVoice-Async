import React, { useState, useRef } from 'react'
import { addMessage } from '../services/conversationStore.js'
import { speak } from '../audio/TextToSpeech.js'

export const QUICK_MESSAGES = [
  { id: 'qm-1', text: 'I need emergency help.', category: 'emergency', icon: '🚨' },
  { id: 'qm-2', text: 'Please call an ambulance.', category: 'emergency', icon: '🚑' },
  { id: 'qm-3', text: 'Please call 100.', category: 'emergency', icon: '📞' },
  { id: 'qm-4', text: 'Please call 112.', category: 'emergency', icon: '📞' },
  { id: 'qm-5', text: 'Please call emergency services.', category: 'emergency', icon: '🆘' },
  { id: 'qm-6', text: 'I need help.', category: 'medical', icon: '🙋‍♂️' },
  { id: 'qm-7', text: 'I need a doctor.', category: 'medical', icon: '👨‍⚕️' },
  { id: 'qm-8', text: 'I need medicine.', category: 'medical', icon: '💊' },
  { id: 'qm-9', text: 'I am in pain.', category: 'medical', icon: '🩺' },
  { id: 'qm-10', text: 'Please wait.', category: 'general', icon: '⏳' },
  { id: 'qm-11', text: "I don't understand.", category: 'general', icon: '❓' },
  { id: 'qm-12', text: 'Sorry.', category: 'general', icon: '🙏' },
]

export default function QuickMessages() {
  const [activeId, setActiveId] = useState(null)
  const cooldownRef = useRef(false)

  const handleQuickMessageClick = (msg) => {
    if (cooldownRef.current) return
    cooldownRef.current = true

    // Visual feedback for click
    setActiveId(msg.id)
    setTimeout(() => setActiveId(null), 800)

    // 1. Add exact message to existing conversation store
    try {
      addMessage({
        sender: 'sign_user',
        text: msg.text,
        type: 'sign',
      })
    } catch (err) {
      console.error('Failed to add quick message to conversation:', err)
    }

    // 2. Speak message immediately using existing TTS implementation
    try {
      speak(msg.text)
    } catch (err) {
      console.error('Failed to speak quick message:', err)
    }

    // Cooldown safety to prevent accidental duplicate triggers
    setTimeout(() => {
      cooldownRef.current = false
    }, 350)
  }

  return (
    <section className="quick-messages-section" aria-label="Quick Communication Messages">
      <div className="quick-messages-header">
        <div className="quick-messages-title-wrap">
          <div className="quick-messages-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="quick-messages-title">Quick Communication</h2>
            <p className="quick-messages-subtitle">
              Instant phrases for quick access & emergency assistance
            </p>
          </div>
        </div>
        <span className="quick-messages-badge">12 Presets</span>
      </div>

      <div className="quick-messages-grid" role="group" aria-label="Quick message presets">
        {QUICK_MESSAGES.map((msg) => {
          const isActive = activeId === msg.id
          const isEmergency = msg.category === 'emergency'

          return (
            <button
              key={msg.id}
              type="button"
              className={`quick-message-btn ${isEmergency ? 'quick-message-btn--emergency' : ''} ${isActive ? 'quick-message-btn--active' : ''}`}
              onClick={() => handleQuickMessageClick(msg)}
              title={`Send & Speak: "${msg.text}"`}
              aria-label={`Quick message: ${msg.text}`}
            >
              <span className="quick-message-btn__icon" aria-hidden="true">
                {msg.icon}
              </span>
              <span className="quick-message-btn__text">{msg.text}</span>
              <span className="quick-message-btn__speaker" aria-hidden="true" title="Audio TTS">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
