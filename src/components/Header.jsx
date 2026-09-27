export default function Header() {
  return (
    <header className="app-header">
      <div className="app-header__badge">
        <span className="app-header__badge-dot" />
        <span>Real-Time Multimodal AI</span>
      </div>
      <h1>SignVoice</h1>
      <p className="app-header__tagline">
        Two-way sign language and speech communication, in real time.
      </p>
    </header>
  )
}
