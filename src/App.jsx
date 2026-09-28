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

export default function App() {
  const [view, setView] = useState(() => {
    const path = window.location.pathname
    const isAuth = sessionStorage.getItem('signvoice_auth') === 'true'
    if (path === '/app') {
      return isAuth ? 'app' : 'login'
    }
    if (path === '/login') {
      return 'login'
    }
    return 'landing'
  })

  const [activeNav, setActiveNav] = useState('sign-speak')

  // Handle browser back/forward button navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
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
      setActiveNav('sign-speak')
    } else {
      navigateTo('login', '/login')
    }
  }

  const handleLoginSuccess = () => {
    sessionStorage.setItem('signvoice_auth', 'true')
    navigateTo('app', '/app')
    setActiveNav('sign-speak')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('signvoice_auth')
    navigateTo('login', '/login')
  }

  const handleNavigateLanding = () => {
    navigateTo('landing', '/')
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
