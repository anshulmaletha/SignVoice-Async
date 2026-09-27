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
      <div className="app__panels">
        <SignUserPanel />
        <SpeechUserPanel />
      </div>
      <ConversationHistory />
    </div>
  )
}
