import React from 'react'

export default function CameraFeed({ videoRef, error, isReady, gestureText, confidence }) {
  if (error) {
    return (
      <div className="camera-feed camera-feed--unavailable">
        <div className="camera-feed__unavailable-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="unavail-svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="camera-feed__unavailable-title">Camera Feed Offline</div>
        <div className="camera-feed__unavailable-text">Enable camera access in your browser to start sign language gesture input.</div>
      </div>
    )
  }

  return (
    <div className="camera-viewport">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`camera-feed ${isReady ? 'camera-feed--active' : ''}`}
      />

      {/* Clean minimal camera framing overlay */}
      <div className="camera-overlay-container">
        <div className="camera-overlay-top">
          <span className={`camera-status-pill ${isReady ? 'camera-status-pill--live' : 'camera-status-pill--standby'}`}>
            <span className="camera-status-dot" />
            {isReady ? 'LIVE' : 'INITIALIZING'}
          </span>
          <span className="camera-mode-pill">
            {isReady ? 'Camera Ready' : 'Loading Model'}
          </span>
        </div>

        {isReady && gestureText && (
          <div className="camera-overlay-bottom">
            <div className="camera-gesture-pill">
              <span className="camera-gesture-label">Detected Sign:</span>
              <span className="camera-gesture-val">{gestureText}</span>
              {confidence > 0 && (
                <span className="camera-gesture-conf">{Math.round(confidence * 100)}%</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
