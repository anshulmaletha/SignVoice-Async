import React, { useEffect, useRef } from 'react'
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl'
import './Particles.css'

function hexToRgb(hex) {
  let c = hex.replace('#', '')
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('')
  }
  const num = parseInt(c, 16)
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255
  ]
}

const defaultColors = ['#8C7B70', '#A99A91', '#DDD0C8']

export default function Particles({
  particleCount = 800,
  speed = 0.25,
  particleBaseSize = 55,
  moveParticlesOnHover = true,
  particleHoverFactor = 0.3,
  alphaParticles = true,
  disableRotation = false,
  particleColors = defaultColors,
  className = ''
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 2),
      alpha: true,
      transparent: true
    })
    const gl = renderer.gl
    container.appendChild(gl.canvas)

    const camera = new Camera(gl, { fov: 60 })
    camera.position.z = 2

    const width = container.clientWidth || window.innerWidth
    const height = container.clientHeight || window.innerHeight
    const aspect = width / height

    // Aspect-proportional bounds so particles span 0% to 100% width and height evenly
    const xSpan = 2.2 * aspect
    const ySpan = 2.2

    const count = particleCount
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count * 4)
    const colors = new Float32Array(count * 3)

    const paletteRgb = particleColors.map(hexToRgb)

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * xSpan * 2
      positions[i * 3 + 1] = (Math.random() - 0.5) * ySpan * 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5

      randoms[i * 4 + 0] = Math.random()
      randoms[i * 4 + 1] = Math.random()
      randoms[i * 4 + 2] = Math.random()
      randoms[i * 4 + 3] = Math.random()

      const color = paletteRgb[Math.floor(Math.random() * paletteRgb.length)]
      colors[i * 3 + 0] = color[0]
      colors[i * 3 + 1] = color[1]
      colors[i * 3 + 2] = color[2]
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: colors }
    })

    const vertexShader = /* glsl */ `
      attribute vec3 position;
      attribute vec4 random;
      attribute vec3 color;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform float uTime;
      uniform float uSpeed;
      uniform float uBaseSize;
      uniform float uHoverFactor;
      uniform vec2 uMouse;
      uniform bool uMoveParticlesOnHover;
      uniform bool uDisableRotation;

      varying vec3 vColor;
      varying vec4 vRandom;

      void main() {
        vColor = color;
        vRandom = random;

        vec3 pos = position;
        float time = uTime * uSpeed;

        if (!uDisableRotation) {
          pos.x += sin(time + random.z * 6.28318) * 0.16;
          pos.y += cos(time + random.w * 6.28318) * 0.16;
        }

        if (uMoveParticlesOnHover) {
          vec2 mousePos = uMouse;
          vec2 particlePos = vec2(pos.x, pos.y);
          float dist = distance(mousePos, particlePos);
          float maxDist = 0.9;
          if (dist < maxDist) {
            float force = (1.0 - dist / maxDist) * uHoverFactor;
            vec2 dir = normalize(particlePos - mousePos);
            pos.x += dir.x * force;
            pos.y += dir.y * force;
          }
        }

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        // Size distribution: 65% small dots, 25% medium bubbles, 10% larger soft bubbles
        float rand = random.x;
        float sizeFactor = 0.5 + rand * 0.45; // 65% small dots
        if (rand > 0.90) {
          sizeFactor = 2.4 + (rand - 0.90) * 8.0; // 10% larger soft bubbles
        } else if (rand > 0.65) {
          sizeFactor = 1.3 + (rand - 0.65) * 4.0; // 25% medium bubbles
        }

        gl_PointSize = (uBaseSize * sizeFactor) / -mvPosition.z;
      }
    `

    const fragmentShader = /* glsl */ `
      precision highp float;

      varying vec3 vColor;
      varying vec4 vRandom;

      uniform bool uAlphaParticles;

      void main() {
        vec2 circ = gl_PointCoord - vec2(0.5);
        float distSq = dot(circ, circ);
        if (distSq > 0.25) discard;

        float alpha = 1.0 - smoothstep(0.08, 0.25, distSq);
        if (uAlphaParticles) {
          alpha *= (0.4 + 0.6 * vRandom.y);
        }

        gl_FragColor = vec4(vColor, alpha * 0.75);
      }
    `

    const uniforms = {
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uBaseSize: { value: particleBaseSize },
      uHoverFactor: { value: particleHoverFactor },
      uMouse: { value: [0, 0] },
      uMoveParticlesOnHover: { value: moveParticlesOnHover },
      uDisableRotation: { value: disableRotation },
      uAlphaParticles: { value: alphaParticles }
    }

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false
    })

    const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program })

    function handleResize() {
      if (!container) return
      const w = container.clientWidth || window.innerWidth
      const h = container.clientHeight || window.innerHeight
      renderer.setSize(w, h)
      camera.perspective({ aspect: w / h })
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    function handleMouseMove(e) {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      const asp = rect.width / rect.height
      uniforms.uMouse.value[0] = x * (1.15 * asp)
      uniforms.uMouse.value[1] = y * 1.15
    }

    window.addEventListener('mousemove', handleMouseMove)

    let animationId
    function animate(t) {
      animationId = requestAnimationFrame(animate)
      uniforms.uTime.value = t * 0.001
      renderer.render({ scene: mesh, camera })
    }
    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      if (container && gl.canvas && container.contains(gl.canvas)) {
        container.removeChild(gl.canvas)
      }
    }
  }, [
    particleCount,
    speed,
    particleBaseSize,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    disableRotation,
    particleColors
  ])

  return <div ref={containerRef} className={`particles-container ${className}`} />
}
