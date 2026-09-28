import React, { useState, useRef, useEffect } from 'react'

/**
 * AnimatedBackground Component
 * 
 * Provides a smooth sliding background pill behind active or hovered child navigation items.
 * 
 * @param {string} value - Current active item ID.
 * @param {Function} onValueChange - Callback when item is selected.
 * @param {React.ReactNode} children - Navigation buttons/links with data-id attributes.
 * @param {string} [className] - Additional wrapper class.
 * @param {boolean} [enableHover=true] - Enable smooth background movement on hover.
 */
export function AnimatedBackground({
  value,
  onValueChange,
  children,
  className = '',
  enableHover = true
}) {
  const containerRef = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)
  const [activeRect, setActiveRect] = useState(null)
  const [hoverRect, setHoverRect] = useState(null)

  useEffect(() => {
    if (!containerRef.current) return
    const activeEl = containerRef.current.querySelector(`[data-id="${value}"]`)
    if (activeEl) {
      setActiveRect({
        left: activeEl.offsetLeft,
        top: activeEl.offsetTop,
        width: activeEl.offsetWidth,
        height: activeEl.offsetHeight
      })
    }
  }, [value])

  useEffect(() => {
    if (!containerRef.current || !hoveredId) {
      setHoverRect(null)
      return
    }
    const hoverEl = containerRef.current.querySelector(`[data-id="${hoveredId}"]`)
    if (hoverEl) {
      setHoverRect({
        left: hoverEl.offsetLeft,
        top: hoverEl.offsetTop,
        width: hoverEl.offsetWidth,
        height: hoverEl.offsetHeight
      })
    }
  }, [hoveredId])

  const currentRect = hoverRect || activeRect

  return (
    <div
      ref={containerRef}
      className={`animated-bg-container ${className}`}
      onMouseLeave={() => setHoveredId(null)}
    >
      {currentRect && (
        <span
          className={`animated-bg-pill ${hoverRect ? 'animated-bg-pill--hover' : 'animated-bg-pill--active'}`}
          style={{
            transform: `translate3d(${currentRect.left}px, ${currentRect.top}px, 0)`,
            width: `${currentRect.width}px`,
            height: `${currentRect.height}px`,
          }}
        />
      )}
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child
        const childId = child.props['data-id'] || child.key
        return React.cloneElement(child, {
          onMouseEnter: (e) => {
            if (enableHover && childId) setHoveredId(childId)
            if (child.props.onMouseEnter) child.props.onMouseEnter(e)
          },
          onClick: (e) => {
            if (onValueChange && childId) onValueChange(childId)
            if (child.props.onClick) child.props.onClick(e)
          }
        })
      })}
    </div>
  )
}

export default AnimatedBackground
