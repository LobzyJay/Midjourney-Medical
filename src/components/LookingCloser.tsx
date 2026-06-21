import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { Container, Grid } from './Container'
import { SectionGlow } from './SectionGlow'

/**
 * S3a · LOOKING CLOSER — editorial Swiss/mono. The reconstructed body volume,
 * swept slice by slice, floating in the void with the machine's real numbers
 * set in the negative space beside it. Footage + copy from the MJ blogpost.
 */
const VOLUMES = [
  { key: 'body_slice', label: 'Torso volume' },
  { key: 'leg_slice', label: 'Leg volume' },
] as const

export function LookingCloser() {
  const ref = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -20% 0px' })
  const [vol, setVol] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView, vol])

  return (
    <section
      id="closer"
      ref={ref}
      className="relative flex min-h-[100dvh] items-center overflow-hidden py-24"
      style={{ borderTop: '1px solid var(--hairline)' }}
    >
      {/* cool clinical wash over the grayscale scan */}
      <SectionGlow rgb="var(--glow-cool)" at="50% 48%" size="70% 80%" opacity={0.14} z={1} />

      {/* the swept volume — a centered vertical band, cropped so it never
          spreads into the side text columns (even on the contact-sheet frame) */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center justify-center">
        <video
          ref={videoRef}
          key={VOLUMES[vol].key}
          className="h-[78vh] object-cover object-center opacity-90"
          style={{ width: 'clamp(220px, 30vw, 420px)' }}
          muted
          loop
          playsInline
          preload="metadata"
          poster={`/scan/${VOLUMES[vol].key}.jpg`}
        >
          <source src={`/scan/${VOLUMES[vol].key}.webm`} type="video/webm" />
        </video>
      </div>

      <Container className="relative z-10 w-full">
        <Grid className="items-center gap-y-10">
          {/* left — the narrative, mono */}
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

          {/* right — the data, set as a clinical spec strip */}
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

        {/* volume toggle */}
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
    </section>
  )
}
