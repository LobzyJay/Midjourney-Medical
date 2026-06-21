import { useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion'
import { Container } from './Container'
import { asset } from '../lib/asset'

/**
 * S4 · WHAT IT SEES — the real Midjourney segmentation slices. Scroll-driven:
 * a tall wrapper pins the panel while you scroll, advancing through the slices
 * and crossfading each raw reconstruction into its AI segmentation as you go.
 * Each slice carries a baked-in anatomical leader-line HUD. Assets pulled from
 * the MJ Medical blogpost CDN. (PRD §8 S4)
 */
const SLICES = [
  { key: 'male_upper_abdomen', region: 'Male · upper abdomen' },
  { key: 'female_upper_abdomen', region: 'Female · upper abdomen' },
  { key: 'female_thigh', region: 'Female · thigh' },
  { key: 'male_thigh', region: 'Male · thigh' },
] as const

const N = SLICES.length

export function WhatItSees() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [showSeg, setShowSeg] = useState(false)

  // scroll 0→1 across the tall wrapper; each slice owns a 1/N band.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })

  // within-band progress drives the raw→seg crossfade (ramps in over the first
  // half of each band, holds segmented for the rest).
  const segOpacity = useTransform(scrollYProgress, (p) => {
    const local = (p * N) % 1
    const t = Math.min(1, Math.max(0, (local - 0.18) / 0.32))
    return t * t * (3 - 2 * t)
  })

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const i = Math.min(N - 1, Math.max(0, Math.floor(p * N)))
    setIdx((prev) => (prev === i ? prev : i))
    const local = (p * N) % 1
    const seg = local > 0.34
    setShowSeg((prev) => (prev === seg ? prev : seg))
  })

  // jump the page so the chosen slice sits mid-band
  const scrollToSlice = (i: number) => {
    const el = ref.current
    if (!el) return
    const range = el.offsetHeight - window.innerHeight
    window.scrollTo({ top: el.offsetTop + range * ((i + 0.4) / N), behavior: 'smooth' })
  }

  const slice = SLICES[idx]

  return (
    <section
      id="sees"
      ref={ref}
      className="relative"
      style={{ background: '#000000', height: reduce ? undefined : `${N * 95}vh` }}
    >
      <div
        className="flex flex-col justify-center py-24"
        style={
          reduce
            ? { minHeight: '100dvh' }
            : { position: 'sticky', top: 0, minHeight: '100dvh' }
        }
      >
        <Container className="relative z-10 w-full">
          {/* header */}
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <p className="label">What It Sees</p>
              <p
                className="authored mt-3 max-w-[20ch]"
                style={{ fontSize: 'clamp(1.5rem, 3.6vw, 2.75rem)', color: 'var(--cream)' }}
              >
                A detailed map of what&apos;s inside, down to a fraction of a millimetre.
              </p>
            </div>
            <p className="label hidden shrink-0 text-right md:block" style={{ opacity: 0.6 }}>
              {slice.region}
              <br />
              <span className="font-mono text-[10px] tracking-wide">
                {showSeg || reduce ? 'SEGMENTATION' : 'RECONSTRUCTION'}
              </span>
            </p>
          </div>

          {/* the slice — raw grayscale, the colour segmentation crossfading over it */}
          <div className="relative mx-auto aspect-[2/1] w-full overflow-hidden rounded-lg">
            <img
              src={asset(`/scan/${slice.key}_raw.webp`)}
              alt={`Reconstructed scan slice — ${slice.region}`}
              className="absolute inset-0 h-full w-full object-contain"
            />
            <motion.img
              key={`${slice.key}-seg`}
              src={asset(`/scan/${slice.key}_seg.webp`)}
              alt={`AI segmentation — ${slice.region}`}
              className="absolute inset-0 h-full w-full object-contain"
              style={{ opacity: reduce ? 1 : segOpacity }}
            />
          </div>

          {/* slice indicator + real caption */}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="label max-w-[52ch]" style={{ opacity: 0.6, lineHeight: 1.6 }}>
              Each slice crossfades between the raw reconstruction and its AI segmentation as you
              scroll — what the scan lets us identify inside the body.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {SLICES.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  aria-label={`Go to ${s.region}`}
                  onClick={() => scrollToSlice(i)}
                  className="h-1.5 rounded-full transition-[width,background-color] duration-300 ease-out
                             active:scale-90 [@media(hover:hover)]:hover:bg-cream/50"
                  style={{
                    width: i === idx ? 28 : 10,
                    background: i === idx ? 'var(--cream)' : 'rgba(231,227,212,0.3)',
                  }}
                />
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  )
}
