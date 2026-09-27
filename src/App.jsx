import React from 'react'
import './App.css'
import Header from './components/Header.jsx'
import SignUserPanel from './components/SignUserPanel.jsx'
import SpeechUserPanel from './components/SpeechUserPanel.jsx'
import ConversationHistory from './components/ConversationHistory.jsx'

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="app__workspace">
        <aside className="app__left-col" aria-label="Sign Language & Camera Feed">
          <SignUserPanel />
        </aside>
        <section className="app__right-col" aria-label="Speech & Conversation History">
          <SpeechUserPanel />
          <ConversationHistory />
        </section>
      </main>
    </div>
  )
}
