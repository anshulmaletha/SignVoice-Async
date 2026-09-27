import React, { useState } from 'react'
import './App.css'
import Header from './components/Header.jsx'
import SignUserPanel from './components/SignUserPanel.jsx'
import SpeechUserPanel from './components/SpeechUserPanel.jsx'
import ConversationHistory from './components/ConversationHistory.jsx'
import DashboardView from './views/DashboardView.jsx'
import SessionsView from './views/SessionsView.jsx'
import FriendsView from './views/FriendsView.jsx'
import ProfileView from './views/ProfileView.jsx'
import SettingsView from './views/SettingsView.jsx'

export default function App() {
  const [activeNav, setActiveNav] = useState('sign-speak')

  return (
    <div className="app-container">
      {/* 1. Horizontal Top Navigation Bar */}
      <Header activeNav={activeNav} onNavigate={setActiveNav} />

      {/* 2. Main Workspace Content Area below Topbar */}
      <div className="app-main">
        {activeNav === 'sign-speak' && (
          <div className="workspace-columns">
            {/* Center / Left Column: Real Webcam Feed & Gesture Results */}
            <main className="column-vision" aria-label="Sign Language Vision Workspace">
              <SignUserPanel />
            </main>

            {/* Right Column: Speech Recognition & Live Conversation Feed */}
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

        {activeNav === 'profile' && (
          <main className="workspace-view" aria-label="User Profile">
            <ProfileView onNavigate={setActiveNav} />
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
