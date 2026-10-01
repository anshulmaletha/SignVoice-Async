import { useEffect, useRef, useState } from 'react'
import { subscribe, getMessages } from '../services/conversationStore.js'
import ConversationMessageItem from './ConversationMessageItem.jsx'
import ClearConversationButton from './ClearConversationButton.jsx'

export default function ConversationHistory() {
  const [messages, setMessages] = useState(getMessages())
  const listRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribe((updated) => setMessages(updated))
    return unsubscribe
  }, [])

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages])

  return (
    <section className="conversation-history" aria-label="Live Conversation History">
      <div className="conversation-history__header">
        <div className="conversation-history__title-group">
          <div className="live-pulse-dot" />
          <h2 className="conversation-history__title">Live Conversation</h2>
          <span className="conversation-history__count">
            {messages.length} {messages.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        {messages.length > 0 && <ClearConversationButton />}
      </div>
      <div
        className="conversation-history__list"
        ref={listRef}
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <div className="conversation-history__empty">
            <div className="empty-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="empty-chat-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="empty-chat-title">Conversation Feed Idle</p>
            <small className="empty-chat-subtitle">Sign to the camera or speak into the microphone to begin two-way communication.</small>
          </div>
        ) : (
          messages.map((m) => (
            <ConversationMessageItem key={m.id} message={m} />
          ))
        )}
      </div>
    </section>
  )
}
