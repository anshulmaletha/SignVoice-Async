import React from 'react'

export default function ConfidenceBar({ confidence }) {
  const pct = Math.round(Math.max(0, Math.min(1, confidence)) * 100)
  return (
    <div className="confidence-wrapper">
      <div className="confidence-label">
        <span className="confidence-title">Confidence</span>
        <span className="confidence-value">{pct}%</span>
      </div>
      <div className="confidence-bar" aria-label={`Confidence ${pct}%`}>
        <div className="confidence-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
