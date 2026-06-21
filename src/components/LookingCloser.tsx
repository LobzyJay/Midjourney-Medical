import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { Container, Grid } from './Container'
import { SectionGlow } from './SectionGlow'

/**
 * S3a · LOOKING CLOSER — the reconstructed body volume, swept slice by slice.
 * The full (uncropped) video starts large and scales DOWN as you scroll, landing
 * small and centered by the halfway point; the editorial copy fades in around it.
 */
const VOLUMES = [
  { key: 'body_slice', label: 'Torso volume' },
  { key: 'leg_slice', label: 'Leg volume' },
] as const

export function LookingCloser() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const reduce = useReducedMotion()
  const inView = useInView(stickyRef, { margin: '0px 0px -10% 0px' })
  const [vol, setVol] = useState(0)

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })
  // full frame → small centered over the first half of the scroll, then holds
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.34])
  const textOpacity = useTransform(scrollYProgress, [0.4, 0.62], [0, 1])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView, vol])

  const video = (
    <video
      ref={videoRef}
      key={VOLUMES[vol].key}
      className="max-h-[88vh] w-full object-contain opacity-95"
      muted
      loop
      playsInline
      preload="metadata"
      poster={`/scan/${VOLUMES[vol].key}.jpg`}
    >
      <source src={`/scan/${VOLUMES[vol].key}.webm`} type="video/webm" />
    </video>
  )

  const copy = (
    <Container className="w-full">
      <Grid className="items-center gap-y-10">
        <div className="col-span-4 md:col-span-3 lg:col-span-4">
          <p className="label">Looking Closer</p>
          <h2
            className="authored mt-4 max-w-[12ch]"
            style={{ fontSize: 'clamp(1.75rem, 4vw, 3rem)', color: 'var(--cream)' }}
          >
            A choir and an audience, half a million strong.
          </h2>
          <p className="mt-6 max-w-[34ch] font-mono text-[12px] leading-relaxed text-cream-dim md:text-[13px]">
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
              ['1 sec of scan', '= 500 hrs of HD video'],
              ['Descent', '5 cm / sec'],
            ].map(([k, v], i) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-4 py-3"
                style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hairline)' }}
              >
                <dt className="label" style={{ letterSpacing: '0.14em' }}>
                  {k}
                </dt>
                <dd className="text-right text-cream">{v}</dd>
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
            className="label transition-opacity duration-300 ease-out"
            style={{
              opacity: i === vol ? 1 : 0.4,
              color: i === vol ? 'var(--cream)' : undefined,
              borderBottom: i === vol ? '1px solid var(--cream)' : '1px solid transparent',
              paddingBottom: 4,
            }}
          >
            {vd.label}
          </button>
        ))}
      </div>
    </Container>
  )

  // reduced motion: no scrub — show a contained video + copy, static
  if (reduce) {
    return (
      <section
        id="closer"
        ref={stickyRef}
        className="relative flex min-h-[100dvh] flex-col items-center justify-center gap-10 py-24"
        style={{ borderTop: '1px solid var(--hairline)' }}
      >
        <SectionGlow rgb="var(--glow-cool)" at="50% 48%" size="70% 80%" opacity={0.14} z={1} />
        <div className="mx-auto w-[min(46vw,460px)]">{video}</div>
        <div className="relative z-10 w-full">{copy}</div>
      </section>
    )
  }

  return (
    <section
      id="closer"
      ref={trackRef}
      style={{ height: '220vh', borderTop: '1px solid var(--hairline)' }}
      className="relative"
    >
      <div ref={stickyRef} className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <SectionGlow rgb="var(--glow-cool)" at="50% 48%" size="70% 80%" opacity={0.14} z={1} />

        {/* the full video frame, scaling down to centered-small */}
        <motion.div
          style={{ scale }}
          className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
        >
          {video}
        </motion.div>

        {/* editorial copy fades in around the shrunken frame */}
        <motion.div style={{ opacity: textOpacity }} className="relative z-10 w-full">
          {copy}
        </motion.div>
      </div>
    </section>
  )
}
