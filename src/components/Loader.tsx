import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { MARK_PATH } from './markPath'

/**
 * Page loader — the Midjourney mark is SCANNED in: a glowing gold scan line
 * sweeps top→bottom and the cream logo fills in behind it (paint-on). Fast:
 * reveals as soon as fonts are ready and the short scan has played, then hands
 * off to the page with a subtle, immersive crossfade (the overlay lifts + blurs
 * away while App scales the page in). Reduced-motion: static mark + quick fade.
 */
const SCAN = 1.3 // seconds — the scan sweep (kept short so no time is wasted)

export function Loader({ onReveal }: { onReveal?: () => void }) {
  const reduce = useReducedMotion()
  const [done, setDone] = useState(false)

  // reveal as soon as fonts are ready AND the scan has had time to read — no
  // artificial waiting beyond that.
  useEffect(() => {
    let alive = true
    const minDwell = new Promise((r) => setTimeout(r, reduce ? 250 : SCAN * 1000 + 150))
    const fonts =
      typeof document !== 'undefined' && 'fonts' in document
        ? (document as Document & { fonts: FontFaceSet }).fonts.ready
        : Promise.resolve()
    Promise.all([minDwell, fonts]).then(() => {
      if (!alive) return
      setDone(true)
      onReveal?.() // let the page settle in as the overlay lifts away
    })
    return () => {
      alive = false
    }
  }, [reduce, onReveal])

  // lock scroll while the loader is up
  useEffect(() => {
    if (done) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: 'var(--void)' }}
          initial={{ opacity: 1 }}
          // immersive hand-off: the overlay lifts toward the viewer, softens, and
          // fades — as if you pass through it into the page
          exit={{ opacity: 0, scale: 1.06, filter: 'blur(6px)' }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* faint radial breath, same language as the rest of the site */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(50% 40% at 50% 48%, rgba(231,227,212,0.05), transparent 70%)',
            }}
          />

          <svg
            viewBox="0 0 367 393"
            className="h-20 w-auto md:h-24"
            style={{ color: 'var(--cream)', overflow: 'visible' }}
            role="img"
            aria-label="Loading Midjourney Medical"
          >
            {reduce ? (
              <path d={MARK_PATH} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
            ) : (
              <>
                <defs>
                  {/* the scan reveal — a rect that grows top→bottom, clipping the
                      filled mark so colour floods in behind the beam (paint-on) */}
                  <clipPath id="loader-scan">
                    <motion.rect
                      x={-10}
                      width={387}
                      y={-10}
                      initial={{ height: 0 }}
                      animate={{ height: 413 }}
                      transition={{ duration: SCAN, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </clipPath>
                  <filter id="loader-beam-glow" x="-50%" y="-400%" width="200%" height="900%">
                    <feGaussianBlur stdDeviation="3.5" />
                  </filter>
                </defs>

                {/* faint un-scanned outline, ahead of the beam */}
                <path
                  d={MARK_PATH}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.14}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* cream fill, revealed by the scan clip */}
                <path
                  d={MARK_PATH}
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  clipPath="url(#loader-scan)"
                />

                {/* the scanner beam — a glowing gold line sweeping with the clip */}
                <motion.g
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 403, opacity: [0, 1, 1, 0] }}
                  transition={{ duration: SCAN, ease: [0.16, 1, 0.3, 1] }}
                >
                  <rect x={-10} width={387} height={3} y={0} fill="#ffb454" filter="url(#loader-beam-glow)" />
                  <rect x={-10} width={387} height={1.5} y={0.75} fill="#ffe2b0" />
                </motion.g>
              </>
            )}
          </svg>

          <motion.span
            className="label mt-7"
            style={{ color: 'var(--cream-dim)' }}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            Midjourney&nbsp;Medical
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
