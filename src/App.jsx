import React, { useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import SignUserPanel from './components/SignUserPanel.jsx'
import SpeechUserPanel from './components/SpeechUserPanel.jsx'
import ConversationHistory from './components/ConversationHistory.jsx'
import DashboardView from './views/DashboardView.jsx'
import SessionsView from './views/SessionsView.jsx'
import FriendsView from './views/FriendsView.jsx'
import SettingsView from './views/SettingsView.jsx'

export default function App() {
  const [activeNav, setActiveNav] = useState('sign-speak')

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar activeNav={activeNav} onNavClick={setActiveNav} />

      {/* 2. Main Workspace Area */}
      <div className="app-main">
        <Header activeNav={activeNav} />

        {activeNav === 'sign-speak' && (
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
        )}

        {activeNav === 'dashboard' && (
          <main className="workspace-view" aria-label="Dashboard Overview">
            <DashboardView onNavigate={setActiveNav} />
          </main>
        )}

        {activeNav === 'sessions' && (
          <main className="workspace-view" aria-label="Past Sessions">
            <SessionsView onNavigate={setActiveNav} />
          </main>
        )}

        {activeNav === 'friends' && (
          <main className="workspace-view" aria-label="Friends and Contacts">
            <FriendsView onNavigate={setActiveNav} />
          </main>
        )}

        {activeNav === 'settings' && (
          <main className="workspace-view" aria-label="Settings and Preferences">
            <SettingsView onNavigate={setActiveNav} />
          </main>
        )}
      </div>
    </div>
  )
}
