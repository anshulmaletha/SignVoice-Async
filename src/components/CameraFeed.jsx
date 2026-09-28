import React from 'react'

export default function CameraFeed({
  videoRef,
  error,
  isReady,
  isCameraOn = true,
  onToggleCamera,
  gestureText,
  confidence
}) {
  if (error || !isCameraOn) {
    return (
      <div className="camera-viewport camera-viewport--offline">
        <div className="camera-feed camera-feed--unavailable">
          <div className="camera-feed__unavailable-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="unavail-svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3l2-3h6l2 3h1.5M10.5 10.5A3.5 3.5 0 0014 14m1-4a3.5 3.5 0 00-3.5-3.5" />
            </svg>
          </div>
          <div className="camera-feed__unavailable-title">
            {error ? 'Camera Access Denied or Unavailable' : 'Camera Feed Paused'}
          </div>
          <div className="camera-feed__unavailable-text">
            {error
              ? 'Enable camera permissions in your browser settings to start sign language input.'
              : 'The camera feed is currently turned off. Turn it on to resume real-time gesture tracking.'}
          </div>
          {onToggleCamera && !error && (
            <button
              type="button"
              className="btn-camera-toggle btn-camera-toggle--on"
              onClick={() => onToggleCamera(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="toggle-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Turn Camera ON</span>
            </button>
          )}
        </div>
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

      {/* Clean Minimal Framing & Controls Overlay */}
      <div className="camera-overlay-container">
        <div className="camera-overlay-top">
          <div className="camera-overlay-left-pills">
            <span className={`camera-status-pill ${isReady ? 'camera-status-pill--live' : 'camera-status-pill--standby'}`}>
              <span className="camera-status-dot" />
              {isReady ? 'LIVE' : 'INITIALIZING'}
            </span>
            <span className="camera-mode-pill">
              {isReady ? 'Camera Active' : 'Loading Detector'}
            </span>
          </div>

          {onToggleCamera && (
            <button
              type="button"
              className="btn-camera-toggle btn-camera-toggle--off camera-overlay-toggle-btn"
              onClick={() => onToggleCamera(false)}
              title="Turn Camera OFF"
              aria-label="Turn Camera OFF"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="toggle-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l22 22M21 21H3a2 2 0 01-2-2V8a2 2 0 012-2h3l2-3h6l2 3h1.5M10.5 10.5A3.5 3.5 0 0014 14m1-4a3.5 3.5 0 00-3.5-3.5" />
              </svg>
              <span>Camera OFF</span>
            </button>
          )}
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
