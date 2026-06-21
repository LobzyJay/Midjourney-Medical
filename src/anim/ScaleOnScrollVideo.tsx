import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, useInView } from 'framer-motion'

export interface ClipSources {
  /** path without extension, e.g. "/clips/descent" → .mp4 + .webm + .jpg */
  src: string
  poster?: string
}

/**
 * ScaleOnScrollVideo — the "scalable video". A small rounded rectangle in the
 * void scales to full-bleed as you scroll over a tall track. (PRD §7, §8 S1)
 *
 * Reduced motion: renders the video full-bleed, no scrub/scale.
 */
export function ScaleOnScrollVideo({
  src,
  poster,
  overlay,
  track = '180vh',
}: {
  src: string
  poster?: string
  overlay?: ReactNode
  /** total scroll distance the scale plays over */
  track?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' })
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // pause when scrolled away (battery); resume on return
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView])

  // play the scale over the first ~half of the track, then hold full-bleed
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.62, 1])
  const radius = useTransform(scrollYProgress, [0, 0.5], [28, 0])
  const titleOpacity = useTransform(scrollYProgress, [0.45, 0.6], [0, 1])

  const video = (
    <video
      ref={videoRef}
      className="h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      poster={poster ?? `${src}.jpg`}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  )

  if (reduce) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden">
        {video}
        {overlay && <div className="absolute inset-0">{overlay}</div>}
      </div>
    )
  }

  return (
    <div ref={ref} style={{ height: track }} className="relative">
      <div className="sticky top-0 flex h-[100dvh] items-center justify-center overflow-hidden">
        <motion.div
          style={{ scale, borderRadius: radius }}
          className="relative h-full w-full overflow-hidden"
        >
          {video}
          {/* low-opacity noise sits above via global overlay; subtle vignette here */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 180px 40px rgba(6,7,10,0.55)',
            }}
          />
          <motion.div style={{ opacity: titleOpacity }} className="absolute inset-0">
            {overlay}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
