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
import { CAM, cameraZ } from '../three/figureFit'

/** Budget point count + DPR to the device — ≤40k cap, lighter on small screens. */
function useMorphBudget() {
  const [budget, setBudget] = useState({ count: 24000, dprMax: 2 })
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      // dense enough that the real skeleton geometry (skull, ribs, sockets)
      // reads as anatomy, not confetti. skeleton.bin holds 90k.
      if (w <= 600) setBudget({ count: 28000, dprMax: 2 })
      else if (w <= 1024) setBudget({ count: 52000, dprMax: 2 })
      else setBudget({ count: 90000, dprMax: 2 })
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

// Anatomy landmarks as 3D points in the figure frame (centered, ~4 tall, y-up),
// calibrated to the body mesh. These are PROJECTED through the same static
// camera as the canvas, so labels track their body part at ANY screen size /
// aspect ratio (fixed screen-% would drift when the figure rescales).
const LANDMARKS: { text: string; at: [number, number, number] }[] = [
  { text: 'CRANIUM', at: [0, 1.92, 0.12] }, // skull
  { text: 'CLAVICLE', at: [0.52, 1.34, 0.1] }, // collarbone
  // (sternum omitted — a centerline landmark's outward leader lands on the body)
  { text: 'HUMERUS', at: [-0.82, 1.28, 0.05] }, // upper arm (T-pose)
  { text: 'PELVIS', at: [0.22, 0.0, 0.12] }, // hip
  { text: 'FEMUR', at: [0.26, -0.78, 0.12] }, // thigh
  { text: 'TIBIA', at: [-0.28, -1.55, 0.08] }, // shin
]

// camera config is shared with ParticleMorph via figureFit (CAM + cameraZ), so
// labels track the figure even as the camera pulls back on portrait viewports.
const TAN_HALF_FOV = Math.tan(((CAM.fov * Math.PI) / 180) / 2)

/** project a figure-frame point to screen percentages for the given aspect (w/h) */
function projectLandmark(p: [number, number, number], aspect: number) {
  const depth = cameraZ(aspect) - p[2]
  const ndcX = p[0] / (TAN_HALF_FOV * aspect * depth)
  const ndcY = (p[1] - CAM.y) / (TAN_HALF_FOV * depth)
  return { x: (ndcX * 0.5 + 0.5) * 100, y: (0.5 - ndcY * 0.5) * 100 }
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
  const [aspect, setAspect] = useState(1.6)
  const { count, dprMax } = useMorphBudget()

  // track viewport aspect so projected labels stay accurate on resize
  useEffect(() => {
    const update = () => setAspect(window.innerWidth / window.innerHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  // park the GPU loop when the canvas is well off-screen
  const inView = useInView(stickyRef, { margin: '60% 0px 60% 0px' })

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  // map scroll → morph progress (0 cells · 0.5 skeleton · 1 body). Piecewise with
  // a deliberate HOLD on the skeleton: the figure forms, then FREEZES as the
  // labelled skeleton for ~a fifth of the track before flowing into the body — so
  // even a fast scroll lands and lingers on the skeleton instead of flying past.
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    const t = Math.min(1, Math.max(0, (p - 0.06) / 0.88))
    let m: number
    if (t < 0.28) m = (t / 0.28) * 0.5 // cells → skeleton form
    else if (t < 0.5) m = 0.5 // hold on the skeleton (dwell)
    else m = 0.5 + ((t - 0.5) / 0.5) * 0.5 // skeleton → full body
    progress.current = m
    setStage(m < 0.34 ? 0 : m < 0.72 ? 1 : 2)
  })

  // labels are the ARRIVAL beat — they fade in only AFTER the figure finishes
  // turning to front (LivingRig reaches yaw 0 at m≈0.72 ⇒ p≈0.7). projectLandmark
  // assumes no rotation, so showing them mid-turn floats the leaders off the body.
  const labelOpacity = useTransform(scrollYProgress, [0.7, 0.78, 1], [0, 1, 1])

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
    <section id="body" ref={trackRef} style={{ height: '460vh', position: 'relative' }}>
      <div ref={stickyRef} className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        {/* the morph canvas — on calm black, no atmosphere glow */}
        <div className="absolute inset-0">
          <ParticleMorph progress={progress} count={count} dprMax={dprMax} active={inView} />
        </div>

        <Brackets />

        {/* stage label — top-left, clinical. Sits below the fixed nav wordmark
            (~58px tall) so the two don't overlap. */}
        <div className="pointer-events-none absolute left-6 top-20 md:left-12 md:top-24">
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
          {LANDMARKS.map((l) => {
            const s = projectLandmark(l.at, aspect)
            // left-side parts point their text outward (left), right-side outward (right)
            const left = l.at[0] < 0
            return (
              <div
                key={l.text}
                className={`absolute flex items-center gap-2 ${left ? 'flex-row-reverse' : ''}`}
                style={
                  left
                    ? { right: `${100 - s.x}%`, top: `${s.y}%`, transform: 'translateY(-50%)' }
                    : { left: `${s.x}%`, top: `${s.y}%`, transform: 'translateY(-50%)' }
                }
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
