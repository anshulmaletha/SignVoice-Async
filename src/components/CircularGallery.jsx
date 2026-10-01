import React, { useEffect, useRef, useState } from 'react'
import { Renderer, Camera, Transform, Plane, Mesh, Program, Texture } from 'ogl'
import './CircularGallery.css'

// Helper to wrap canvas text
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
  return currentY
}

// Generate high-resolution card texture canvas in SignVoice color system (900 x 1150)
function createCardCanvas(item, index) {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 1150
  const ctx = canvas.getContext('2d')

  // Background Gradient - Warm Taupe & Deep Charcoal
  const grad = ctx.createLinearGradient(0, 0, 900, 1150)
  grad.addColorStop(0, '#3A312C')
  grad.addColorStop(0.5, '#302824')
  grad.addColorStop(1, '#221C18')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 900, 1150)

  // Soft Inner Card Border
  ctx.strokeStyle = 'rgba(210, 200, 193, 0.28)'
  ctx.lineWidth = 14
  ctx.strokeRect(28, 28, 844, 1094)

  // Top Accent Line
  const topGrad = ctx.createLinearGradient(70, 70, 830, 70)
  topGrad.addColorStop(0, '#A98977')
  topGrad.addColorStop(0.5, '#F4C79A')
  topGrad.addColorStop(1, '#A98977')
  ctx.fillStyle = topGrad
  ctx.fillRect(70, 70, 760, 10)

  // Card Number Eyebrow Badge
  ctx.fillStyle = '#F4C79A'
  ctx.font = '600 30px Manrope, sans-serif'
  ctx.fillText(`0${index + 1} / ${item.badge || 'SECTION'}`, 80, 140)

  // Title
  ctx.fillStyle = '#F1E7DD'
  ctx.font = '700 70px Manrope, sans-serif'
  ctx.fillText(item.title, 80, 235)

  // Subtitle / Supporting Idea
  ctx.fillStyle = '#CDBFB2'
  ctx.font = '400 34px Manrope, sans-serif'
  wrapText(ctx, item.subtitle, 80, 310, 740, 48)

  // Visual Motif Container (Center graphic area)
  ctx.fillStyle = 'rgba(220, 205, 192, 0.05)'
  ctx.fillRect(80, 440, 740, 500)
  ctx.strokeStyle = 'rgba(210, 200, 193, 0.2)'
  ctx.lineWidth = 4
  ctx.strokeRect(80, 440, 740, 500)

  // Render Section Motif Graphic inside canvas
  if (item.key === 'about') {
    // ABOUT Motif: Hand + AI Assist Icon
    ctx.strokeStyle = 'rgba(244, 199, 154, 0.5)'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(450, 650, 110, 0, Math.PI * 2)
    ctx.stroke()

    // Inner Hand Symbol
    ctx.fillStyle = '#DDD0C8'
    ctx.font = '700 96px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✋', 450, 685)

    // Sparkle / Accessibility Tag
    ctx.fillStyle = '#F4C79A'
    ctx.font = '600 30px Manrope, sans-serif'
    ctx.fillText('INCLUSIVE ACCESSIBILITY', 450, 840)
    ctx.textAlign = 'left'
  } else if (item.key === 'how-it-works') {
    // HOW IT WORKS Motif: SIGN ➔ AI ➔ VOICE Pipeline
    const steps = ['SIGN', 'AI', 'VOICE']
    const xPos = [190, 450, 710]

    steps.forEach((step, i) => {
      ctx.fillStyle = '#A98977'
      ctx.fillRect(xPos[i] - 80, 600, 160, 110)

      ctx.fillStyle = '#F1E7DD'
      ctx.font = '700 32px Manrope, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(step, xPos[i], 668)

      if (i < 2) {
        ctx.fillStyle = '#F4C79A'
        ctx.font = '700 46px sans-serif'
        ctx.fillText('➔', xPos[i] + 130, 668)
      }
    })
    ctx.textAlign = 'left'

    ctx.fillStyle = '#CDBFB2'
    ctx.font = '400 30px Manrope, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Real-Time Translation Pipeline', 450, 840)
    ctx.textAlign = 'left'
  } else if (item.key === 'features') {
    // FEATURES Motif: 4 Feature Pillars
    const feats = [
      '• Sign to Speech',
      '• Speech to Text',
      '• Camera AI Engine',
      '• Real-Time Feed'
    ]
    ctx.fillStyle = '#F1E7DD'
    ctx.font = '600 36px Manrope, sans-serif'
    feats.forEach((f, i) => {
      const fy = 540 + i * 85
      ctx.fillText(f, 150, fy)
    })

    ctx.fillStyle = '#F4C79A'
    ctx.font = '500 28px Manrope, sans-serif'
    ctx.fillText('VERIFIED ACCESSIBLE FEATURES', 150, 885)
  } else if (item.key === 'faq') {
    // FAQ Motif: Conversation Bubbles
    ctx.fillStyle = 'rgba(169, 137, 119, 0.45)'
    ctx.beginPath()
    ctx.roundRect(140, 520, 400, 120, 24)
    ctx.fill()

    ctx.fillStyle = '#F1E7DD'
    ctx.font = '500 30px Manrope, sans-serif'
    ctx.fillText('How does SignVoice work?', 175, 592)

    ctx.fillStyle = 'rgba(244, 199, 154, 0.35)'
    ctx.beginPath()
    ctx.roundRect(360, 680, 400, 120, 24)
    ctx.fill()

    ctx.fillStyle = '#F1E7DD'
    ctx.font = '500 30px Manrope, sans-serif'
    ctx.fillText('Using AI in real time.', 395, 752)
  }

  // Bottom Interactive Callout
  ctx.fillStyle = '#F4C79A'
  ctx.font = '600 34px Manrope, sans-serif'
  ctx.fillText('CLICK TO OPEN ➔', 80, 1020)

  return canvas
}

export default function CircularGallery({
  items = [],
  bend = 3,
  textColor = '#323232',
  borderRadius = 0.05,
  scrollEase = 0.02,
  onItemClick
}) {
  const containerRef = useRef(null)
  const glRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollRef = useRef(0)
  const targetScrollRef = useRef(0)
  const [activeItemIndex, setActiveItemIndex] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !items.length) return

    // 1. Initialize OGL Renderer
    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2)
    })
    const gl = renderer.gl
    glRef.current = { renderer, gl }
    gl.clearColor(0, 0, 0, 0)
    container.appendChild(gl.canvas)

    // 2. Camera & Scene: Positioned for large prominent cards
    const camera = new Camera(gl, { fov: 45 })
    camera.position.set(0, 0, 5.2)

    const scene = new Transform()

    // 3. Shaders: Cylinder curvature & soft border radius
    const vertexShader = `
      attribute vec3 position;
      attribute vec2 uv;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uBend;

      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec3 p = position;
        
        // Curved cylindrical bending along X axis
        p.z += sin(p.x * 0.22) * uBend * 0.16;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `

    const fragmentShader = `
      precision highp float;

      uniform sampler2D tMap;
      uniform float uBorderRadius;
      uniform float uHover;
      varying vec2 vUv;

      float sdRoundedBox(in vec2 p, in vec2 b, in vec4 r) {
        r.xy = (p.x > 0.0) ? r.xy : r.zw;
        r.x  = (p.y > 0.0) ? r.x  : r.y;
        vec2 q = abs(p) - b + r.x;
        return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r.x;
      }

      void main() {
        vec4 color = texture2D(tMap, vUv);
        
        // Rounded corner clipping
        vec2 p = vUv - vec2(0.5);
        float d = sdRoundedBox(p, vec2(0.48 - uBorderRadius * 0.2), vec4(uBorderRadius * 0.5));
        if (d > 0.0) {
          discard;
        }

        // Soft ambient hover brightness
        color.rgb += uHover * 0.08;
        
        gl_FragColor = color;
      }
    `

    // Large prominent card dimensions: width 2.7, height 3.45 in 3D world units
    const planeGeometry = new Plane(gl, { width: 2.7, height: 3.45, widthSegments: 24 })

    // 4. Create Mesh Planes for each item
    const meshes = items.map((item, idx) => {
      const cardCanvas = createCardCanvas(item, idx)
      const texture = new Texture(gl, { generateMipmaps: true })
      texture.image = cardCanvas

      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          tMap: { value: texture },
          uBend: { value: bend },
          uBorderRadius: { value: borderRadius },
          uHover: { value: 0 }
        },
        transparent: true
      })

      const mesh = new Mesh(gl, { geometry: planeGeometry, program })
      mesh.setParent(scene)
      mesh.extraData = { item, idx }
      return mesh
    })

    // Layout math: spacing between cards
    const spacing = 3.35

    // 5. Resize Handler
    const handleResize = () => {
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      camera.perspective({ aspect: width / height })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // 6. Animation Loop
    let animationFrameId
    let dragDistance = 0

    const update = () => {
      // Smooth interpolation using scrollEase
      scrollRef.current += (targetScrollRef.current - scrollRef.current) * scrollEase

      const currentScroll = scrollRef.current

      // Position meshes circularly along X axis
      meshes.forEach((mesh, idx) => {
        const offset = idx * spacing - currentScroll
        mesh.position.x = offset
        mesh.position.y = Math.cos(offset * 0.25) * -0.18
        mesh.rotation.y = offset * -0.11

        // Prominent scale for center/active card
        const distFromCenter = Math.abs(offset)
        const scale = Math.max(0.85, 1.10 - distFromCenter * 0.14)
        mesh.scale.set(scale, scale, scale)

        // Center card brightness highlight
        if (mesh.program && mesh.program.uniforms.uHover) {
          mesh.program.uniforms.uHover.value = Math.max(0, 1 - distFromCenter * 0.8)
        }
      })

      // Determine active item index nearest center
      const activeIdx = Math.round(currentScroll / spacing)
      const clampedIdx = Math.max(0, Math.min(items.length - 1, activeIdx))
      setActiveItemIndex(clampedIdx)

      renderer.render({ scene, camera })
      animationFrameId = requestAnimationFrame(update)
    }

    animationFrameId = requestAnimationFrame(update)

    // 7. Event Listeners (Pointer, Wheel, Touch)
    const onPointerDown = (e) => {
      isDraggingRef.current = true
      startXRef.current = e.clientX || (e.touches && e.touches[0].clientX) || 0
      dragDistance = 0
    }

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return
      const x = e.clientX || (e.touches && e.touches[0].clientX) || 0
      const deltaX = startXRef.current - x
      startXRef.current = x
      dragDistance += Math.abs(deltaX)

      // Update target scroll position
      const sensitivity = 0.0055
      const maxScroll = (items.length - 1) * spacing
      targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current + deltaX * sensitivity))
    }

    const onPointerUp = (e) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false

      // Snap to nearest card
      const activeIdx = Math.round(targetScrollRef.current / spacing)
      const clampedIdx = Math.max(0, Math.min(items.length - 1, activeIdx))
      targetScrollRef.current = clampedIdx * spacing

      // If click (minimal drag distance < 15px), detect which card was clicked and trigger onItemClick
      if (dragDistance < 15 && onItemClick) {
        const rect = container.getBoundingClientRect()
        const clientX = (e.clientX !== undefined) ? e.clientX : (e.changedTouches && e.changedTouches[0]?.clientX) || 0
        const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1
        const aspect = rect.width / rect.height
        const visibleHalfWidth = Math.tan(45 * Math.PI / 360) * 5.2 * aspect
        const clickWorldX = ndcX * visibleHalfWidth

        let targetIdx = clampedIdx
        let minDist = Infinity
        meshes.forEach((mesh, idx) => {
          const dist = Math.abs(mesh.position.x - clickWorldX)
          if (dist < minDist) {
            minDist = dist
            targetIdx = idx
          }
        })

        if (minDist < 1.8) {
          targetScrollRef.current = targetIdx * spacing
          onItemClick(items[targetIdx], targetIdx)
        } else {
          onItemClick(items[clampedIdx], clampedIdx)
        }
      }
    }

    const onWheel = (e) => {
      e.preventDefault()
      const maxScroll = (items.length - 1) * spacing
      const delta = (e.deltaX || e.deltaY) * 0.003
      targetScrollRef.current = Math.max(0, Math.min(maxScroll, targetScrollRef.current + delta))
    }

    const domElement = container
    domElement.addEventListener('mousedown', onPointerDown)
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)

    domElement.addEventListener('touchstart', onPointerDown, { passive: true })
    window.addEventListener('touchmove', onPointerMove, { passive: true })
    window.addEventListener('touchend', onPointerUp)

    domElement.addEventListener('wheel', onWheel, { passive: false })

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)

      domElement.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)

      domElement.removeEventListener('touchstart', onPointerDown)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('touchend', onPointerUp)

      domElement.removeEventListener('wheel', onWheel)

      if (glRef.current && glRef.current.gl) {
        const loseCtx = glRef.current.gl.getExtension('WEBGL_lose_context')
        if (loseCtx) loseCtx.loseContext()
      }

      if (container && renderer.gl.canvas.parentNode === container) {
        container.removeChild(renderer.gl.canvas)
      }
    }
  }, [items, bend, borderRadius, scrollEase, onItemClick])

  return (
    <div className="circular-gallery-wrapper">
      {/* 3D WebGL Canvas Container: Large, prominent, responsive */}
      <div className="circular-gallery-container" ref={containerRef} />

      {/* Subtle Drag / Scroll / Click Prompt */}
      <div className="gallery-drag-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
        <span>Drag / scroll / click cards to explore</span>
      </div>
    </div>
  )
}
