export default function CameraFeed({ videoRef, error }) {
  if (error) {
    return <div className="camera-feed camera-feed--unavailable" />
  }
  return <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
}
