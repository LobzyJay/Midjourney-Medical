import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  useInView,
} from 'framer-motion'
import { ParticleMorph, type MorphHandle } from '../three/ParticleMorph'
import { ANATOMY_LABELS } from '../three/humanPoints'

/** Budget point count + DPR to the device — ≤40k cap, lighter on small screens. */
function useMorphBudget() {
  const [budget, setBudget] = useState({ count: 24000, dprMax: 2 })
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      if (w <= 600) setBudget({ count: 9000, dprMax: 1.5 })
      else if (w <= 1024) setBudget({ count: 16000, dprMax: 1.75 })
      else setBudget({ count: 24000, dprMax: 2 })
    }
    compute()
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])
  return budget
}

const STAGES = [
  { key: 'MATTER', aside: 'Everything starts as nothing in particular.' },
  { key: 'STRUCTURE', aside: 'First the frame that holds you up.' },
  { key: 'THE WHOLE', aside: '…until you can finally see all of it.' },
] as const

// label screen positions around the centered figure (x%, y%)
const LABEL_POS: Record<string, [number, number]> = {
  CRANIUM: [62, 14],
  CLAVICLE: [66, 30],
  STERNUM: [38, 36],
  HUMERUS: [30, 46],
  PELVIS: [60, 58],
  FEMUR: [40, 70],
  TIBIA: [62, 84],
}

/** Corner brackets — the tactical-HUD frame (Avengers grammar). */
function Brackets() {
  const c = 'absolute h-8 w-8 border-cream/25'
  return (
    <div className="pointer-events-none absolute inset-6 md:inset-10">
      <div className={`${c} left-0 top-0 border-l border-t`} />
      <div className={`${c} right-0 top-0 border-r border-t`} />
      <div className={`${c} bottom-0 left-0 border-b border-l`} />
      <div className={`${c} bottom-0 right-0 border-b border-r`} />
    </div>
  )
}

export function BodyMorph() {
  const trackRef = useRef<HTMLDivElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const progress = useRef<MorphHandle>({ current: 0 }).current
  const reduce = useReducedMotion()
  const [stage, setStage] = useState(0)
  const { count, dprMax } = useMorphBudget()
  // park the GPU loop when the canvas is well off-screen
  const inView = useInView(stickyRef, { margin: '60% 0px 60% 0px' })

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  // map scroll → morph progress (0 cells · 0.5 skeleton · 1 body), with holds
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const m = Math.min(1, Math.max(0, (p - 0.08) / 0.78))
    progress.current = m
    setStage(m < 0.34 ? 0 : m < 0.72 ? 1 : 2)
  })

  // anatomical labels read during the skeleton window
  const labelOpacity = useTransform(scrollYProgress, [0.32, 0.45, 0.66, 0.78], [0, 1, 1, 0])

  if (reduce) {
    // graceful fallback — no scrubbed WebGL; the three states stated plainly
    return (
      <section
        id="body"
        className="relative flex min-h-[100dvh] flex-col justify-center"
        style={{ borderTop: '1px solid var(--hairline)', paddingInline: 'var(--margin)' }}
      >
        <p className="label">The Body</p>
        {STAGES.map((s) => (
          <div key={s.key} className="mt-8">
            <p className="label" style={{ color: 'var(--cream)' }}>
              {s.key}
            </p>
            <p className="authored" style={{ fontSize: 'clamp(1.5rem,4vw,2.6rem)' }}>
              {s.aside}
            </p>
          </div>
        ))}
      </section>
    )
  }

  return (
    <section id="body" ref={trackRef} style={{ height: '360vh', position: 'relative' }}>
      <div ref={stickyRef} className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        {/* the morph canvas */}
        <div className="absolute inset-0">
          <ParticleMorph progress={progress} count={count} dprMax={dprMax} active={inView} />
        </div>

        <Brackets />

        {/* stage label — top-left, clinical */}
        <div className="pointer-events-none absolute left-6 top-6 md:left-12 md:top-12">
          <p className="label">The Body</p>
          <p
            className="label mt-2"
            style={{ color: 'var(--cream)', fontSize: '0.95rem', letterSpacing: '0.22em' }}
          >
            {STAGES[stage].key}
          </p>
        </div>

        {/* live morph readout — bottom-left, mono */}
        <div className="pointer-events-none absolute bottom-6 left-6 md:bottom-12 md:left-12">
          <p className="font-mono text-[11px] tracking-wide text-cream-dim">
            STAGE {stage + 1} / 3 · POINTS {(count / 1000).toFixed(1)}K
          </p>
        </div>

        {/* anatomical labels with leader dots (skeleton window) */}
        <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: labelOpacity }}>
          {ANATOMY_LABELS.map((l) => {
            const pos = LABEL_POS[l.text]
            if (!pos) return null
            return (
              <div
                key={l.text}
                className="absolute flex items-center gap-2"
                style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
              >
                <span className="h-1 w-1 rounded-full bg-cream/70" />
                <span className="h-px w-6 bg-cream/25" />
                <span className="font-mono text-[10px] tracking-[0.18em] text-cream-dim">
                  {l.text}
                </span>
              </div>
            )
          })}
        </motion.div>

        {/* authored aside — bottom-right, the human break */}
        <div className="pointer-events-none absolute bottom-10 right-6 max-w-xs text-right md:right-12">
          <p className="authored" style={{ fontSize: 'clamp(1.25rem,2.4vw,1.9rem)' }}>
            {STAGES[stage].aside}
          </p>
        </div>
      </div>
    </section>
  )
}
