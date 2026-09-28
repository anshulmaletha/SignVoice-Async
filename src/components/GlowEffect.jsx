import React from 'react'

/**
 * GlowEffect Component
 * Wraps elements with a warm, subtle, premium glow matching SignVoice palette.
 */
export function GlowEffect({
  children,
  color = 'rgba(140, 123, 112, 0.35)',
  blur = '16px',
  spread = '2px',
  className = ''
}) {
  return (
    <div className={`glow-effect-wrapper ${className}`}>
      <div
        className="glow-effect-backdrop"
        style={{
          boxShadow: `0 0 ${blur} ${spread} ${color}`,
        }}
      />
      {children}
    </div>
  )
}

/**
 * GlowActionButton Component
 * Reusable action button styled with subtle warm glow effects for key actions.
 */
export function GlowActionButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  title,
  icon,
  type = 'button',
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      className={`glow-action-btn glow-action-btn--${variant} ${className}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      {...props}
    >
      <span className="glow-action-btn__glow" />
      <span className="glow-action-btn__content">
        {icon && <span className="glow-action-btn__icon">{icon}</span>}
        {children}
      </span>
    </button>
  )
}

export default GlowEffect
