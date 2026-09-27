import React, { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import SignUserPanel from './components/SignUserPanel.jsx'
import SpeechUserPanel from './components/SpeechUserPanel.jsx'
import ConversationHistory from './components/ConversationHistory.jsx'

export default function App() {
  const [activeNav, setActiveNav] = useState('sign-speak')

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeNav={activeNav} onNavClick={setActiveNav} />

      {/* 2. Main Workspace Area */}
      <div className="app-main">
        <Header />

        <div className="workspace-columns">
          {/* Center Column: Vision Feed & Gestures */}
          <main className="column-vision" aria-label="Sign Language Vision Workspace">
            <SignUserPanel />
          </main>

          {/* Right Column: Speech Recognition & Conversation History */}
          <aside className="column-speech-chat" aria-label="Speech and Live Conversation Workspace">
            <SpeechUserPanel />
            <ConversationHistory />
          </aside>
        </div>
      </div>
    </div>
  )
}
