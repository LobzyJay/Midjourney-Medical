import { lazy, Suspense, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Loader } from './components/Loader'
import { Nav } from './components/Nav'
import { GridOverlay } from './components/GridOverlay'
import { useDebugGrid } from './lib/useDebugGrid'

import { Hero } from './components/Hero'
import { Descent } from './components/Descent'
import { Promise } from './components/Promise'
import { Machine } from './components/Machine'
import { LookingCloser } from './components/LookingCloser'
import { WhatItSees } from './components/WhatItSees'
import { Spa } from './components/Spa'
import { Join } from './components/Join'

// The morph pulls in Three.js (~900KB). Split it out so the hero paints
// immediately and WebGL streams in below the fold. (perf)
const BodyMorph = lazy(() =>
  import('./components/BodyMorph').then((m) => ({ default: m.BodyMorph })),
)

// concept by Layout Studio — MJ-branded pastiche, no on-page credit (HANDOFF §6.4)

/**
 * Section order is LOCKED (HANDOFF §6.8 — morph before descent):
 * Void → BodyMorph → Descent → Promise → Machine → WhatItSees → Spa → Join
 */
export default function App() {
  const showGrid = useDebugGrid()
  const reduce = useReducedMotion()
  const [revealed, setRevealed] = useState(false)

  return (
    <>
      <Loader onReveal={() => setRevealed(true)} />
      <div className="void-breath" aria-hidden />
      <Nav />

      {/* the page settles in as the loader lifts away — a clean crossfade (no
          scale, so the hero never repositions on reveal; the hero runs its own
          intro). */}
      <motion.main
        className="relative z-10"
        initial={reduce ? false : { opacity: 0 }}
        animate={revealed || reduce ? { opacity: 1 } : undefined}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <Hero start={revealed || !!reduce} />
        <Suspense fallback={<section id="body" className="min-h-[100dvh]" />}>
          <BodyMorph />
        </Suspense>
        <Descent />
        <Promise />
        <Machine />
        <LookingCloser />
        <WhatItSees />

        {/* Spa + Join share ONE warm gradient rising from the footer, so they
            read as a single continuous ground rather than two glows + a seam. */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              background:
                'radial-gradient(135% 90% at 50% 100%, rgba(235,150,64,0.16), rgba(235,150,64,0.05) 38%, transparent 70%)',
            }}
          />
          <Spa />
          <Join />
        </div>
      </motion.main>

      <div className="noise" aria-hidden />
      {showGrid && <GridOverlay />}
    </>
  )
}
