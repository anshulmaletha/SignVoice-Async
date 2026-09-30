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
import CookieBanner from './components/CookieBanner.jsx'
import BackToTop from './components/BackToTop.jsx'
import Toast from './components/Toast.jsx'
import ImportantInfoModal from './components/ImportantInfoModal.jsx'
import { setActiveProfile, clearActiveProfile } from './services/profileStore.js'

const APP_NAV_ROUTES = ['dashboard', 'sign-speak', 'sessions', 'friends', 'profile', 'settings']

function getMeetingIdFromPath(pathname) {
  const match = (pathname || '').match(/^\/meeting\/([A-Za-z0-9_-]+)/)
  return match ? match[1] : null
}

function getNavFromPath(pathname) {
  const clean = (pathname || '').replace(/^\/+|\/+$/g, '').toLowerCase()
  if (APP_NAV_ROUTES.includes(clean)) {
    return clean
  }
  return null
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
    const navRoute = getNavFromPath(path)
    if (path === '/app' || path === '/app/' || navRoute) {
      return isAuth ? 'app' : 'login'
    }
    if (path === '/login' || path === '/login/') {
      return 'login'
    }
    return 'landing'
  })

  const [activeNav, setActiveNav] = useState(() => {
    const navRoute = getNavFromPath(window.location.pathname)
    return navRoute || 'dashboard'
  })
  const [infoModalOpen, setInfoModalOpen] = useState(false)

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
      const navRoute = getNavFromPath(path)

      if (path === '/app' || path === '/app/' || navRoute) {
        if (isAuth) {
          setView('app')
          setActiveNav(navRoute || 'dashboard')
        } else {
          sessionStorage.setItem('signvoice_redirect', navRoute || 'dashboard')
          setView('login')
          window.history.replaceState(null, '', '/login')
        }
      } else if (path === '/login' || path === '/login/') {
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

  const handleNavChange = (id) => {
    setActiveNav(id)
    const targetPath = id === 'dashboard' ? '/app' : `/${id}`
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath)
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

  const handleLoginSuccess = (username) => {
    if (username) {
      setActiveProfile(username)
    }
    sessionStorage.setItem('signvoice_auth', 'true')
    const redirectNav = sessionStorage.getItem('signvoice_redirect')
    sessionStorage.removeItem('signvoice_redirect')
    const targetNav = redirectNav || 'dashboard'
    const targetPath = targetNav === 'dashboard' ? '/app' : `/${targetNav}`
    navigateTo('app', targetPath)
    setActiveNav(targetNav)
  }

  const handleLogout = () => {
    sessionStorage.removeItem('signvoice_auth')
    sessionStorage.removeItem('signvoice_redirect')
    clearActiveProfile()
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
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={handleNavigateLanding}
        />
        <CookieBanner />
        <Toast />
      </>
    )
  }

  return (
    <div className="app-container">
      {/* 1. Horizontal Top Navigation Bar */}
      <Header
        activeNav={activeNav}
        onNavigate={handleNavChange}
        onNavigateLanding={handleNavigateLanding}
        onLogout={handleLogout}
        onOpenImportantInfo={() => setInfoModalOpen(true)}
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
              onNavigate={handleNavChange}
              onCreateMeeting={() => handleCreateMeeting()}
            />
          </main>
        )}

        {activeNav === 'sessions' && (
          <main className="workspace-view" aria-label="Past Sessions">
            <SessionsView onNavigate={handleNavChange} />
          </main>
        )}

        {activeNav === 'friends' && (
          <main className="workspace-view" aria-label="Friends and Contacts">
            <FriendsView onNavigate={handleNavChange} />
          </main>
        )}

        {activeNav === 'profile' && (
          <main className="workspace-view" aria-label="User Profile">
            <ProfileView onNavigate={handleNavChange} />
          </main>
        )}

        {activeNav === 'settings' && (
          <main className="workspace-view" aria-label="Settings and Preferences">
            <SettingsView onNavigate={handleNavChange} />
          </main>
        )}
      </div>

      {/* Polish UX Overlays */}
      <CookieBanner />
      <BackToTop />
      <Toast />
      <ImportantInfoModal
        isOpen={infoModalOpen}
        onClose={() => setInfoModalOpen(false)}
      />
    </div>
  )
}
