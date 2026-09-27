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
    <section className="conversation-history" aria-label="Conversation Feed">
      <div className="conversation-history__header">
        <div className="conversation-history__title-group">
          <h2>Live Conversation</h2>
          <span className="conversation-history__count">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
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
            <span className="conversation-history__empty-icon">💬</span>
            <p>No messages yet.</p>
            <small>Sign to the camera or speak into the microphone to begin.</small>
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
