import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Container, Grid } from './Container'
import { asset } from '../lib/asset'

/**
 * S3a · LOOKING CLOSER — a LIGHT section that breaks the void (premium, airy,
 * a deliberate exhale mid-scroll). The reconstructed body volume scales down as
 * you scroll; the grayscale scan is inverted + multiplied so it reads as dark
 * line-art directly on the light ground (no black box).
 */
const VOLUMES = [
  { key: 'body_slice', label: 'Torso volume' },
  { key: 'leg_slice', label: 'Leg volume' },
] as const

// light-theme palette (this section only). The section ground (cream) is a
// different tone from the video card (near-white = the inverted void), so the
// scan reads as a framed panel, not a cutout.
const BG = '#E8E4D8' // section ground
const CARD = '#FAF6F5' // video card ground (= inverted video background)
const INK = '#15171B'
const INK_DIM = 'rgba(21, 23, 27, 0.6)'
const LINE = 'rgba(21, 23, 27, 0.14)'

export function LookingCloser() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(stickyRef, { margin: '0px 0px -10% 0px' })
  const [vol, setVol] = useState(0)
  // below lg the sticky-scrub overlay collides the shrunk video with the stacked
  // text — fall back to the simple stacked layout (same as reduced-motion).
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.34])
  const textOpacity = useTransform(scrollYProgress, [0.4, 0.62], [0, 1])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView, vol])

  // the video lives inside a contained CARD (its own near-white ground, set off
  // from the cream section) and is oversized so object-cover crops both sides —
  // a framed scan panel, not an edge-to-edge cutout.
  const video = (
    <video
      ref={videoRef}
      key={VOLUMES[vol].key}
      className="absolute h-[118%] w-[118%] max-w-none object-cover"
      style={{ left: '-9%', top: '-9%', filter: 'invert(1)', objectPosition: 'center' }}
      muted
      loop
      playsInline
      preload="metadata"
      poster={asset(`/scan/${VOLUMES[vol].key}.jpg`)}
    >
      <source src={asset(`/scan/${VOLUMES[vol].key}.webm`)} type="video/webm" />
    </video>
  )

  const copy = (
    <Container className="w-full">
      <Grid className="items-center gap-y-10">
        <div className="col-span-4 md:col-span-3 lg:col-span-4">
          <p className="label" style={{ color: INK_DIM }}>
            Looking Closer
          </p>
          <h2
            className="authored mt-4 max-w-[12ch]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: INK }}
          >
            It listens the way a dolphin sees.
          </h2>
          <p className="mt-6 max-w-[34ch] font-mono text-[12px] leading-relaxed md:text-[13px]" style={{ color: INK_DIM }}>
            You pass through a ring of half a million tiny squares — each the size of a grain of
            sand, each a speaker and a microphone — sending ultrasonic waves and recording the
            ripples back, millions of times a second.
          </p>
        </div>

        <div className="col-span-4 md:col-span-3 md:col-start-4 lg:col-span-4 lg:col-start-9">
          <dl className="ml-auto max-w-[24ch] font-mono text-[12px] md:text-[13px]">
            {[
              ['Elements', '≈ 500,000'],
              ['Output', 'terabytes / sec'],
              ['Compute', '≈ two petaflops'],
              ['Descent', '5 cm / sec'],
            ].map(([k, v], i) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-4 py-3"
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${LINE}` }}
              >
                <dt className="label" style={{ letterSpacing: '0.14em', color: INK_DIM }}>
                  {k}
                </dt>
                <dd className="text-right" style={{ color: INK }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Grid>

      <div className="mt-12 flex items-center gap-3">
        {VOLUMES.map((vd, i) => (
          <button
            key={vd.key}
            type="button"
            onClick={() => setVol(i)}
            className="label transition-[opacity,color,transform] duration-200 ease-out
                       active:scale-95 [@media(hover:hover)]:hover:opacity-100"
            style={{
              color: i === vol ? INK : INK_DIM,
              opacity: i === vol ? 1 : 0.7,
              borderBottom: i === vol ? `1px solid ${INK}` : '1px solid transparent',
              paddingBottom: 4,
            }}
          >
            {vd.label}
          </button>
        ))}
      </div>
    </Container>
  )

  if (reduce || compact) {
    return (
      <section
        id="closer"
        ref={stickyRef}
        className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-10 py-24"
        style={{ background: BG, color: INK }}
      >
        <div
          className="relative mx-auto aspect-video w-[86vw] overflow-hidden rounded-2xl md:w-[min(60vw,560px)]"
          style={{ background: CARD }}
        >
          {video}
        </div>
        <div className="relative z-10 w-full">{copy}</div>
      </section>
    )
  }

  return (
    <section
      id="closer"
      ref={trackRef}
      style={{ height: '220vh', background: BG, color: INK }}
      className="relative"
    >
      <div ref={stickyRef} className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <motion.div
          style={{ scale }}
          className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
        >
          <div
            className="relative aspect-[16/9] w-[86vw] max-w-[1200px] overflow-hidden rounded-[20px] shadow-[0_30px_80px_-30px_rgba(21,23,27,0.25)]"
            style={{ background: CARD }}
          >
            {video}
          </div>
        </motion.div>

        <motion.div style={{ opacity: textOpacity }} className="relative z-10 w-full">
          {copy}
        </motion.div>
      </div>
    </section>
  )
}
