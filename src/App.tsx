import { lazy, Suspense } from 'react'
import { Nav } from './components/Nav'
import { SoundToggle } from './components/SoundToggle'
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

  return (
    <>
      <div className="void-breath" aria-hidden />
      <Nav />

      <main className="relative z-10">
        <Hero />
        <Suspense fallback={<section id="body" className="min-h-[100dvh]" />}>
          <BodyMorph />
        </Suspense>
        <Descent />
        <Promise />
        <Machine />
        <LookingCloser />
        <WhatItSees />
        <Spa />
        <Join />
      </main>

      <SoundToggle />
      <div className="noise" aria-hidden />
      {showGrid && <GridOverlay />}
    </>
  )
}
