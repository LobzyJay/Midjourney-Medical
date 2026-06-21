import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * PinnedClip — a footage section that plays its own muted looping clip when it
 * enters view, pausing when it leaves (IntersectionObserver, battery-friendly).
 * Gentle fade-in on enter. (PRD §7, §10)
 */
export function PinnedClip({
  src,
  poster,
  className = '',
  children,
  objectPosition = 'center',
  vignette = true,
  formats = ['webm', 'mp4'],
}: {
  src: string
  poster?: string
  className?: string
  children?: ReactNode
  objectPosition?: string
  /** the cinematic inset darkening — turn off for clean editorial figures */
  vignette?: boolean
  /** which source files exist for this clip (skips 404s on mp4-only assets) */
  formats?: Array<'webm' | 'mp4'>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inView = useInView(wrapRef, { margin: '0px 0px -20% 0px' })

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) {
      const p = v.play()
      if (p) p.catch(() => {})
    } else {
      v.pause()
    }
  }, [inView])

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0.0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          style={{ objectPosition }}
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster ?? `${src}.jpg`}
        >
          {formats.includes('webm') && <source src={`${src}.webm`} type="video/webm" />}
          {formats.includes('mp4') && <source src={`${src}.mp4`} type="video/mp4" />}
        </video>
        {/* crossfade-to-black breathing at the edges (Asme fade-loop feel) */}
        {vignette && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: 'inset 0 0 200px 60px rgba(6,7,10,0.7)' }}
          />
        )}
      </motion.div>
      {children}
    </div>
  )
}
