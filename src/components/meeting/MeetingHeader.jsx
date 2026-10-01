import React, { useState } from 'react'
import { getMeetingUrl } from '../../utils/meetingId.js'
import signvoiceLogo from '../../assets/signvoice-logo.jpg'

export default function MeetingHeader({
  meetingId,
  connectionState = 'waiting', // 'waiting' | 'connecting' | 'connected' | 'full'
  ttsEnabled = true,
  onToggleTts,
  onLeaveMeeting,
}) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    try {
      const url = getMeetingUrl(meetingId)
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return 'Reconnecting...'
      case 'disconnected':
        return 'Participant disconnected'
      case 'full':
        return 'Meeting Full'
      case 'waiting':
      default:
        return 'Waiting for participant...'
    }
  }

  return (
    <header className="meeting-header" aria-label="Meeting Header">
      <div className="meeting-header__left">
        <button
          type="button"
          className="meeting-header__brand"
          onClick={onLeaveMeeting}
          title="Return to Home"
          aria-label="SignVoice Home"
        >
          <img
            src={signvoiceLogo}
            alt="SignVoice"
            className="meeting-header__badge-img"
          />
          <span className="meeting-header__title">
            <span className="wordmark-sign">Sign</span>
            <span className="wordmark-voice">Voice</span>
          </span>
        </button>

        <div className="meeting-header__room-pill" title="Meeting Identifier">
          <span>Room:</span>
          <span>{meetingId}</span>
        </div>

        <button
          type="button"
          className={`meeting-header__copy-btn ${copied ? 'meeting-header__copy-btn--copied' : ''}`}
          onClick={handleCopyLink}
          aria-label="Copy shareable meeting link"
        >
          {copied ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>

      <div className="meeting-header__right">
        <div className={`meeting-status-pill meeting-status-pill--${connectionState}`}>
          <span className="meeting-status-dot" />
          <span>{getStatusText()}</span>
        </div>

        {onToggleTts && (
          <button
            type="button"
            className={`meeting-header__copy-btn ${ttsEnabled ? '' : 'meeting-control-btn--off'}`}
            onClick={onToggleTts}
            title={ttsEnabled ? 'Mute Incoming Sign Speech (TTS)' : 'Enable Incoming Sign Speech (TTS)'}
          >
            <span>{ttsEnabled ? '🔊 TTS ON' : '🔇 TTS OFF'}</span>
          </button>
        )}

        <button
          type="button"
          className="meeting-btn-leave"
          onClick={onLeaveMeeting}
          title="Leave Meeting Room"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          <span>Leave</span>
        </button>
      </div>
    </header>
  )
}
