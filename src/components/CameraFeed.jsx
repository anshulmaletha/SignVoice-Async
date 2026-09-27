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
        <div className="camera-feed__unavailable-text">Check browser permissions to enable real-time gesture input.</div>
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

      {/* Warm Golden HUD Overlay */}
      <div className="camera-hud" aria-hidden="true">
        <span className="camera-hud__corner camera-hud__corner--tl" />
        <span className="camera-hud__corner camera-hud__corner--tr" />
        <span className="camera-hud__corner camera-hud__corner--bl" />
        <span className="camera-hud__corner camera-hud__corner--br" />
        
        {isReady && <div className="camera-hud__scanline" />}

        {/* HUD Status Overlay Badges */}
        <div className="camera-hud__overlay-top">
          <span className={`hud-badge ${isReady ? 'hud-badge--live' : 'hud-badge--standby'}`}>
            <span className="hud-badge__dot" />
            {isReady ? 'LIVE TRACKING' : 'INITIALIZING'}
          </span>
          <span className="hud-badge hud-badge--mode">
            OPTICAL FEED
          </span>
        </div>

        {isReady && gestureText && (
          <div className="camera-hud__overlay-bottom">
            <div className="hud-gesture-pill">
              <span className="hud-gesture-pill__icon">👁️</span>
              <span className="hud-gesture-pill__text">{gestureText}</span>
              {confidence > 0 && (
                <span className="hud-gesture-pill__conf">{Math.round(confidence * 100)}%</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
