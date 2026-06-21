import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Container } from './Container'
import { SectionGlow } from './SectionGlow'

/**
 * S4 · WHAT IT SEES — the real Midjourney segmentation slices. Each slice
 * carries a baked-in anatomical leader-line HUD; we crossfade the raw
 * reconstruction into its AI segmentation, then advance to the next slice.
 * Assets pulled from the MJ Medical blogpost CDN. (PRD §8 S4)
 */
const SLICES = [
  { key: 'male_upper_abdomen', region: 'Male · upper abdomen' },
  { key: 'female_upper_abdomen', region: 'Female · upper abdomen' },
  { key: 'female_thigh', region: 'Female · thigh' },
  { key: 'male_thigh', region: 'Male · thigh' },
] as const

export function WhatItSees() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '0px 0px -25% 0px' })
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [showSeg, setShowSeg] = useState(false)

  // crossfade raw↔seg, advancing to the next slice after a full reveal
  useEffect(() => {
    if (reduce || !inView) return
    let phase = 0
    const id = setInterval(() => {
      phase = (phase + 1) % 4
      if (phase === 1) setShowSeg(true) // raw → seg
      else if (phase === 3) setShowSeg(false) // seg → raw
      else if (phase === 0) setIdx((i) => (i + 1) % SLICES.length) // advance
    }, 1600)
    return () => clearInterval(id)
  }, [reduce, inView])

  const slice = SLICES[idx]

  return (
    <section
      id="sees"
      ref={ref}
      className="relative flex min-h-[100dvh] flex-col justify-center py-24"
      style={{ borderTop: '1px solid var(--hairline)' }}
    >
      <SectionGlow rgb="var(--glow-teal)" at="50% 52%" size="75% 70%" opacity={0.1} />
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
              {showSeg ? 'SEGMENTATION' : 'RECONSTRUCTION'}
            </span>
          </p>
        </div>

        {/* the slice — raw grayscale crossfading into colour segmentation */}
        <div className="relative mx-auto aspect-[2/1] w-full overflow-hidden rounded-lg">
          <img
            src={`/scan/${slice.key}_raw.webp`}
            alt={`Reconstructed scan slice — ${slice.region}`}
            className="absolute inset-0 h-full w-full object-contain"
          />
          <AnimatePresence>
            {(showSeg || reduce) && (
              <motion.img
                key={`${slice.key}-seg`}
                src={`/scan/${slice.key}_seg.webp`}
                alt={`AI segmentation — ${slice.region}`}
                className="absolute inset-0 h-full w-full object-contain"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* slice selector + real caption */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="label max-w-[52ch]" style={{ opacity: 0.6, lineHeight: 1.6 }}>
            Each slice continuously crossfades between the raw reconstruction and its AI
            segmentation — what the scan lets us identify inside the body.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {SLICES.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Show ${s.region}`}
                onClick={() => {
                  setIdx(i)
                  setShowSeg(false)
                }}
                className="h-1.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: i === idx ? 28 : 10,
                  background: i === idx ? 'var(--cream)' : 'rgba(231,227,212,0.3)',
                }}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
