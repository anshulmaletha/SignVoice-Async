import React, { useState, useEffect } from 'react'
import './App.css'
import LandingPage from './components/LandingPage.jsx'
import LoginView from './views/LoginView.jsx'
import Header from './components/Header.jsx'
import SignUserPanel from './components/SignUserPanel.jsx'
import SpeechUserPanel from './components/SpeechUserPanel.jsx'
import ConversationHistory from './components/ConversationHistory.jsx'
import DashboardView from './views/DashboardView.jsx'
import SessionsView from './views/SessionsView.jsx'
import FriendsView from './views/FriendsView.jsx'
import ProfileView from './views/ProfileView.jsx'
import SettingsView from './views/SettingsView.jsx'
import MeetingRoom from './components/meeting/MeetingRoom.jsx'
import { generateMeetingId } from './utils/meetingId.js'

function getMeetingIdFromPath(pathname) {
  const match = (pathname || '').match(/^\/meeting\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

export default function App() {
  const [currentMeetingId, setCurrentMeetingId] = useState(() => {
    return getMeetingIdFromPath(window.location.pathname)
  })

  const [view, setView] = useState(() => {
    const path = window.location.pathname
    const meetingId = getMeetingIdFromPath(path)
    if (meetingId) {
      return 'meeting'
    }
    const isAuth = sessionStorage.getItem('signvoice_auth') === 'true'
    if (path === '/app') {
      return isAuth ? 'app' : 'login'
    }
    if (path === '/login') {
      return 'login'
    }
    return 'landing'
  })

  const [activeNav, setActiveNav] = useState('dashboard')

  // Handle browser back/forward button navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const meetingId = getMeetingIdFromPath(path)

      if (meetingId) {
        setCurrentMeetingId(meetingId)
        setView('meeting')
        return
      }

      setCurrentMeetingId(null)
      const isAuth = sessionStorage.getItem('signvoice_auth') === 'true'

      if (path === '/app') {
        if (isAuth) {
          setView('app')
        } else {
          setView('login')
          window.history.replaceState(null, '', '/login')
        }
      } else if (path === '/login') {
        setView('login')
      } else {
        setView('landing')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigateTo = (targetView, path) => {
    setView(targetView)
    if (path && window.location.pathname !== path) {
      window.history.pushState(null, '', path)
    }
  }

  const handleGetStarted = () => {
    const isAuth = sessionStorage.getItem('signvoice_auth') === 'true'
    if (isAuth) {
      navigateTo('app', '/app')
      setActiveNav('dashboard')
    } else {
      navigateTo('login', '/login')
    }
  }

  const handleLoginSuccess = () => {
    sessionStorage.setItem('signvoice_auth', 'true')
    navigateTo('app', '/app')
    setActiveNav('dashboard')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('signvoice_auth')
    navigateTo('login', '/login')
  }

  const handleCreateMeeting = (meetingId) => {
    const id = meetingId || generateMeetingId()
    setCurrentMeetingId(id)
    navigateTo('meeting', `/meeting/${id}`)
  }

  const handleLeaveMeeting = () => {
    setCurrentMeetingId(null)
    const isAuth = sessionStorage.getItem('signvoice_auth') === 'true'
    if (isAuth) {
      navigateTo('app', '/app')
      setActiveNav('dashboard')
    } else {
      navigateTo('landing', '/')
    }
  }

  const handleNavigateLanding = () => {
    navigateTo('landing', '/')
  }

  if (view === 'meeting' && currentMeetingId) {
    return (
      <MeetingRoom
        meetingId={currentMeetingId}
        onLeaveMeeting={handleLeaveMeeting}
      />
    )
  }

  if (view === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />
  }

  if (view === 'login') {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={handleNavigateLanding}
      />
    )
  }

  return (
    <div className="app-container">
      {/* 1. Horizontal Top Navigation Bar */}
      <Header
        activeNav={activeNav}
        onNavigate={setActiveNav}
        onNavigateLanding={handleNavigateLanding}
        onLogout={handleLogout}
      />

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
            <DashboardView
              onNavigate={setActiveNav}
              onCreateMeeting={() => handleCreateMeeting()}
            />
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
