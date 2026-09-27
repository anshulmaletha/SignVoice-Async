export default function CameraFeed({ videoRef, error, isReady }) {
  if (error) {
    return (
      <div className="camera-feed camera-feed--unavailable">
        <div className="camera-feed__unavailable-icon">📷</div>
        <div className="camera-feed__unavailable-text">Camera stream unavailable</div>
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
      {isReady && (
        <div className="camera-hud" aria-hidden="true">
          <span className="camera-hud__corner camera-hud__corner--tl" />
          <span className="camera-hud__corner camera-hud__corner--tr" />
          <span className="camera-hud__corner camera-hud__corner--bl" />
          <span className="camera-hud__corner camera-hud__corner--br" />
          <div className="camera-hud__scanline" />
        </div>
      )}
    </div>
  )
}
