export default function CameraFeed({ videoRef, error }) {
  if (error) {
    return <div className="camera-error">Camera unavailable ({error})</div>
  }
  return (
    <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
  )
}
