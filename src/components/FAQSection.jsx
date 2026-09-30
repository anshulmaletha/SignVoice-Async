import React, { useState } from 'react'

const FAQ_ITEMS = [
  {
    question: 'What is SignVoice?',
    answer: 'SignVoice is an AI-powered communication platform that translates hand gestures into spoken voice and speech into live text in real time, bridging the gap between Deaf and hearing individuals.'
  },
  {
    question: 'How does SignVoice convert sign language into text?',
    answer: 'SignVoice uses camera vision with MediaPipe hand landmark tracking and custom neural classifiers to analyze gesture positions and confidence scores in real time.'
  },
  {
    question: 'Can SignVoice be used during a live meeting?',
    answer: 'Yes! SignVoice features a shared two-way live conversation workspace where gesture translation and speech-to-text feed into a unified real-time timeline.'
  },
  {
    question: 'Can users communicate using both sign language and speech?',
    answer: 'parser: Absolutely. SignVoice supports bi-directional communication: signers use hand gestures that are spoken aloud via text-to-speech, while speakers talk into the microphone to display live text captions.'
  },
  {
    question: 'Does SignVoice require a webcam?',
    answer: 'A camera or webcam is required for sign language gesture recognition. Speech-to-text and past conversation history can still be accessed without a camera.'
  },
  {
    question: 'Is SignVoice designed for accessibility?',
    answer: 'Yes. SignVoice is built specifically for accessibility with high-contrast themes, visible keyboard focus indicators, full screen-reader ARIA semantics, and customizable user settings.'
  },
  {
    question: 'How do I create or join a meeting?',
    answer: 'Click "Get Started" on the landing page to log in, then select the "Sign & Speak" workspace or "Dashboard" to immediately start a real-time conversation session.'
  }
]

// Clean up answer text formatting
FAQ_ITEMS[3].answer = 'parser: Absolutely. SignVoice supports bi-directional communication: signers use hand gestures that are spoken aloud via text-to-speech, while speakers talk into the microphone to display live text captions.'.replace('parser: ', '')

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleItem = (index) => {
    setOpenIndex((prevIndex) => (prevIndex === index ? null : index))
  }

  return (
    <section className="landing-faq-section" aria-labelledby="faq-heading">
      <div className="faq-container">
        <div className="faq-header">
          <div className="eyebrow-text faq-eyebrow">QUESTIONS & ANSWERS</div>
          <h2 id="faq-heading" className="faq-title">Frequently Asked Questions</h2>
          <p className="faq-subtitle">
            Everything you need to know about SignVoice gesture recognition, speech translation, and accessibility.
          </p>
        </div>

        <div className="faq-accordion">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            const answerId = `faq-answer-${index}`
            const buttonId = `faq-button-${index}`

            return (
              <div
                key={index}
                className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}
              >
                <button
                  type="button"
                  id={buttonId}
                  className="faq-question-btn"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                >
                  <span className="faq-question-text">{item.question}</span>
                  <span className="faq-icon-wrap" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="faq-chevron"
                      width="18"
                      height="18"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </button>

                <div
                  id={answerId}
                  className="faq-answer-wrapper"
                  role="region"
                  aria-labelledby={buttonId}
                  style={{
                    maxHeight: isOpen ? '500px' : '0px',
                    opacity: isOpen ? 1 : 0
                  }}
                >
                  <p className="faq-answer-text">{item.answer}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
