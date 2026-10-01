import React, { useState } from 'react'

export function showToast(message) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('signvoice:show-toast', { detail: { message } })
    )
  }
}

export default function CopyButton({
  textToCopy,
  label = 'Copy',
  toastMessage,
  className = '',
  iconOnly = false
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!textToCopy) return

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy)
      } else {
        // Fallback for older browsers or non-secure contexts
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopied(true)
      showToast(toastMessage || `${label || 'Text'} copied!`)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.warn('Clipboard copy failed:', err)
      showToast('Failed to copy to clipboard')
    }
  }

  return (
    <button
      type="button"
      className={`btn-copy ${copied ? 'btn-copy--copied' : ''} ${className}`}
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard!' : `Copy ${label}`}
      aria-label={copied ? 'Copied to clipboard' : `Copy ${label}`}
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {!iconOnly && <span>Copied!</span>}
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  )
}
