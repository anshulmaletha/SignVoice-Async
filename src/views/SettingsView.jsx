import React, { useState, useEffect } from 'react'
import { getSettings, updateSettings, subscribeSettings } from '../services/settingsStore.js'
import { speak } from '../audio/TextToSpeech.js'

export default function SettingsView({ onNavigate }) {
  const [settings, setSettings] = useState(getSettings())
  const [videoDevices, setVideoDevices] = useState([])
  const [audioDevices, setAudioDevices] = useState([])
  const [voices, setVoices] = useState([])
  const [savedFeedback, setSavedFeedback] = useState('')

  useEffect(() => {
    const unsub = subscribeSettings(setSettings)
    return unsub
  }, [])

  // Enumerate real hardware devices if permitted
  useEffect(() => {
    async function getDevices() {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices()
          setVideoDevices(devices.filter((d) => d.kind === 'videoinput'))
          setAudioDevices(devices.filter((d) => d.kind === 'audioinput'))
        } catch (e) {
          console.warn('Could not enumerate devices', e)
        }
      }
    }
    getDevices()

    // Get TTS Voices
    function loadVoices() {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const v = window.speechSynthesis.getVoices()
        if (v.length > 0) setVoices(v)
      }
    }
    loadVoices()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  function handleChange(key, val) {
    updateSettings({ [key]: val })
    setSavedFeedback('Settings updated')
    setTimeout(() => setSavedFeedback(''), 1500)
  }

  function handleTestTts() {
    speak('SignVoice text to speech is ready.')
  }

  return (
    <div className="view-container settings-view">
      {/* Header */}
      <div className="view-header">
        <div>
          <h2 className="view-title">Settings & Preferences</h2>
          <p className="view-subtitle">Configure input hardware, speech synthesis parameters, and accessibility.</p>
        </div>
        {savedFeedback && (
          <span className="settings-saved-badge">✓ {savedFeedback}</span>
        )}
      </div>

      <div className="settings-cards-grid">
        {/* Hardware Devices Card */}
        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__icon">📷</span>
            <div>
              <h3 className="settings-card__title">Hardware & Devices</h3>
              <p className="settings-card__desc">Select camera and microphone inputs.</p>
            </div>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Camera Device</label>
              <select
                className="form-select"
                value={settings.selectedCameraId}
                onChange={(e) => handleChange('selectedCameraId', e.target.value)}
              >
                <option value="">Default System Camera</option>
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Microphone Device</label>
              <select
                className="form-select"
                value={settings.selectedMicId}
                onChange={(e) => handleChange('selectedMicId', e.target.value)}
              >
                <option value="">Default System Microphone</option>
                {audioDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Microphone ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Text-To-Speech Card */}
        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__icon">🔊</span>
            <div>
              <h3 className="settings-card__title">Speech Synthesis (TTS)</h3>
              <p className="settings-card__desc">Customize synthesized voice feedback for gestures.</p>
            </div>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Preferred Voice</label>
              <select
                className="form-select"
                value={settings.ttsVoice}
                onChange={(e) => handleChange('ttsVoice', e.target.value)}
              >
                <option value="">System Default Voice</option>
                {voices.map((v, i) => (
                  <option key={v.name || i} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-row">
              <div className="form-group flex-1">
                <div className="slider-label-row">
                  <label className="form-label">Speech Rate</label>
                  <span className="slider-val">{settings.ttsRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.8"
                  step="0.1"
                  className="form-slider"
                  value={settings.ttsRate}
                  onChange={(e) => handleChange('ttsRate', parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group flex-1">
                <div className="slider-label-row">
                  <label className="form-label">Pitch</label>
                  <span className="slider-val">{settings.ttsPitch}</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.1"
                  className="form-slider"
                  value={settings.ttsPitch}
                  onChange={(e) => handleChange('ttsPitch', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <button type="button" className="btn-secondary-small" onClick={handleTestTts}>
              🔊 Test Speech Output
            </button>
          </div>
        </div>

        {/* Multimodal Safety & Echo Guard */}
        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__icon">🛡️</span>
            <div>
              <h3 className="settings-card__title">Multimodal Duplex Safety</h3>
              <p className="settings-card__desc">Acoustic feedback and echo suppression parameters.</p>
            </div>
          </div>
          <div className="settings-form">
            <div className="setting-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Acoustic Echo Guard</span>
                <span className="toggle-desc">Mutes speech recognition while TTS is speaking to prevent feedback loops.</span>
              </div>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={settings.echoGuard}
                onChange={(e) => handleChange('echoGuard', e.target.checked)}
              />
            </div>

            <div className="setting-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Mock / Demo Stream Mode</span>
                <span className="toggle-desc">Enable offline mock gesture & speech stream without physical camera.</span>
              </div>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={settings.demoMode}
                onChange={(e) => {
                  const val = e.target.checked
                  handleChange('demoMode', val)
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href)
                    if (val) url.searchParams.set('demoMode', 'mock')
                    else url.searchParams.delete('demoMode')
                    window.history.replaceState({}, '', url.toString())
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Accessibility & Display Preferences */}
        <div className="settings-card">
          <div className="settings-card__header">
            <span className="settings-card__icon">👁️</span>
            <div>
              <h3 className="settings-card__title">Accessibility & Layout</h3>
              <p className="settings-card__desc">Adjust readability and auto-scroll behaviors.</p>
            </div>
          </div>
          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Caption & Message Font Scale</label>
              <select
                className="form-select"
                value={settings.fontSize}
                onChange={(e) => handleChange('fontSize', e.target.value)}
              >
                <option value="standard">Standard (Default)</option>
                <option value="large">Large (High Legibility)</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            <div className="setting-toggle-row">
              <div className="toggle-info">
                <span className="toggle-title">Auto-Scroll Conversation</span>
                <span className="toggle-desc">Automatically scroll feed to newest message upon arrival.</span>
              </div>
              <input
                type="checkbox"
                className="toggle-checkbox"
                checked={settings.autoScrollChat}
                onChange={(e) => handleChange('autoScrollChat', e.target.checked)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
