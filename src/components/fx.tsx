// Small motion building blocks used across the site.

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react'

const media = (f: string) => `${import.meta.env.BASE_URL}media/${f}`

// Button that leans toward the pointer.
export function Magnetic({ children, strength = 0.35 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 })
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 })
  return (
    <motion.div
      ref={ref}
      className="magnetic"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return
        const r = ref.current!.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * strength)
        y.set((e.clientY - (r.top + r.height / 2)) * strength)
      }}
      onPointerLeave={() => { x.set(0); y.set(0) }}
    >
      {children}
    </motion.div>
  )
}

// Card that tilts in 3D with a moving glare.
export function Tilt({ children, className = '', max = 10, style, onClick, as = 'div', label }: {
  children: ReactNode; className?: string; max?: number; style?: CSSProperties; onClick?: () => void; as?: 'div' | 'button'; label?: string
}) {
  const reduce = useReducedMotion()
  const rx = useSpring(0, { stiffness: 160, damping: 18 })
  const ry = useSpring(0, { stiffness: 160, damping: 18 })
  const Comp = as === 'button' ? motion.button : motion.div
  return (
    <Comp
      className={`tilt ${className}`}
      aria-label={label}
      style={{ rotateX: rx, rotateY: ry, ...style }}
      onClick={onClick}
      onPointerMove={(e: React.PointerEvent<HTMLElement>) => {
        if (reduce || e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        ry.set((px - 0.5) * max * 2)
        rx.set(-(py - 0.5) * max * 2)
        e.currentTarget.style.setProperty('--gx', `${px * 100}%`)
        e.currentTarget.style.setProperty('--gy', `${py * 100}%`)
      }}
      onPointerLeave={() => { rx.set(0); ry.set(0) }}
    >
      {children}
      <span className="glare" />
    </Comp>
  )
}

// Fade + rise on scroll into view.
export function Reveal({ children, delay = 0, y = 40, className, style }: { children: ReactNode; delay?: number; y?: number; className?: string; style?: CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

// Headline where each word rises out of a mask.
export function Kinetic({ lines, className = '', delay = 0, as: Tag = 'h2', inView = true }: {
  lines: (string | { text: string; cls?: string })[]; className?: string; delay?: number; as?: 'h1' | 'h2'; inView?: boolean
}) {
  // The heading itself watches the viewport; masked words would never count as visible.
  let i = 0
  const MotionTag = Tag === 'h1' ? motion.h1 : motion.h2
  const word = {
    hidden: { y: '110%', rotate: 6 },
    show: (n: number) => ({ y: '0%', rotate: 0, transition: { duration: 1.15, delay: delay + n * 0.07, ease: [0.22, 1, 0.36, 1] as const } }),
  }
  const trigger = inView
    ? { whileInView: 'show', viewport: { once: true, margin: '-8% 0px' } }
    : { animate: 'show' }
  return (
    <MotionTag className={`display ${className}`} initial="hidden" {...trigger}>
      {lines.map((l, li) => {
        const { text, cls } = typeof l === 'string' ? { text: l, cls: '' } : l
        const words = text.split(' ')
        return (
          <span className="line" key={li} style={{ display: 'block', overflow: 'hidden', paddingBottom: '0.06em' }}>
            {words.map((w, wi) => (
              <motion.span key={wi} className={`word ${cls ?? ''}`} style={{ display: 'inline-block', transformOrigin: 'left bottom' }}
                variants={word} custom={i++}>
                {w}{wi < words.length - 1 ? ' ' : ''}
              </motion.span>
            ))}
          </span>
        )
      })}
    </MotionTag>
  )
}

// Background video that only plays while on screen.
export function VideoBg({ src, poster, className = '', rate = 1 }: { src: string; poster: string; className?: string; rate?: number }) {
  const ref = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.playbackRate = rate
    if (reduce) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    }, { threshold: 0.05 })
    io.observe(v)
    return () => io.disconnect()
  }, [reduce, rate])
  return (
    <div className={`video-bg ${className}`}>
      <video ref={ref} muted loop playsInline preload="metadata" poster={media(poster)} aria-hidden="true">
        <source src={media(src)} type="video/mp4" />
      </video>
    </div>
  )
}

// Ring cursor that follows with a spring and grows over interactive things.
export function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 380, damping: 32, mass: 0.5 })
  const sy = useSpring(y, { stiffness: 380, damping: 32, mass: 0.5 })
  const [hover, setHover] = useState(false)
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      x.set(e.clientX); y.set(e.clientY)
      const t = e.target as HTMLElement
      setHover(!!t.closest('a, button, [role="button"], .tilt'))
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])
  return (
    <>
      <motion.div className={`cursor ${hover ? 'is-hover' : ''}`} style={{ x: sx, y: sy }} />
      <motion.div className="cursor-dot" style={{ x, y }} />
    </>
  )
}

export { media }
