import { useEffect, useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, useInView } from 'framer-motion'

/**
 * ScaleOnScrollVideo — the "scalable visual". A small rounded rectangle in the
 * void scales to full-bleed as you scroll, then keeps zooming in slightly so the
 * frame stays alive while the overlay text fades in (continuous parallax).
 * (PRD §7, §8 S1)
 *
 * Reduced motion: renders the visual full-bleed, no scrub/scale.
 */
export function ScaleOnScrollVideo({
  src,
  poster,
  overlay,
  track = '180vh',
}: {
  /** clip path without extension, e.g. "/clips/control_loop" → .mp4 + .webm + .jpg */
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

  // scale up over the first ~half, then keep a gentle zoom-in through the rest
  // so the frame still drifts after the title has faded in (continuous parallax).
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.62, 1, 1.08])
  const radius = useTransform(scrollYProgress, [0, 0.5], [28, 0])
  const titleOpacity = useTransform(scrollYProgress, [0.45, 0.6], [0, 1])

  const media = (
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

  // fade the lower edge of the full-bleed visual into the void so it melts into
  // the section below (on --void) instead of a hard cut at the seam.
  const bottomFade = (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%]"
      style={{ background: 'linear-gradient(to bottom, transparent, var(--void))' }}
    />
  )

  if (reduce) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden">
        {media}
        {bottomFade}
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
          {media}
          {/* low-opacity noise sits above via global overlay; subtle vignette here */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 180px 40px rgba(6,7,10,0.55)',
            }}
          />
          {bottomFade}
          <motion.div style={{ opacity: titleOpacity }} className="absolute inset-0">
            {overlay}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
