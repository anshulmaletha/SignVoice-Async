import { useEffect, useRef, useState } from 'react'
import { subscribe, getMessages } from '../services/conversationStore.js'
import ConversationMessageItem from './ConversationMessageItem.jsx'
import ClearConversationButton from './ClearConversationButton.jsx'

export default function ConversationHistory() {
  const [messages, setMessages] = useState(getMessages())
  const bottomRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribe((updated) => setMessages(updated))
    return unsubscribe
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="conversation-history">
      <div className="conversation-history__header">
        <h2>Conversation</h2>
        <ClearConversationButton />
      </div>
      <div className="conversation-history__list">
        {messages.length === 0 && (
          <p className="conversation-history__empty">No messages yet.</p>
        )}
        {messages.map((m) => (
          <ConversationMessageItem key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
