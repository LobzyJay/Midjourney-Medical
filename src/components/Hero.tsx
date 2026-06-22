import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { WordsPullUp } from '../anim/WordsPullUp'
import { Container } from './Container'
import { asset } from '../lib/asset'

// Echo field pulls in r3f — lazy so it only loads if selected.
const EchoField = lazy(() =>
  import('../three/EchoField').then((m) => ({ default: m.EchoField })),
)

type Variant = 'studio' | 'echo'

function initialVariant(): Variant {
  if (typeof window === 'undefined') return 'echo'
  // ECHO is the locked direction; ?hero=studio stays as a review escape hatch.
  const q = new URLSearchParams(window.location.search).get('hero')
  return q === 'studio' ? 'studio' : 'echo'
}

/**
 * Studio variant — the compute-rack control room (announce ~1:20) as a parallax
 * still: a slow Ken-Burns push, a scroll drift, and a subtle mouse parallax give
 * the photo depth. A directional scrim is weighted to the lower-left, where the
 * type sits, so the monitor reads in open space instead of behind the headline.
 */
function HeroStudio({
  scrollYProgress,
  reduce,
}: {
  scrollYProgress: MotionValue<number>
  reduce: boolean
}) {
  const mx = useSpring(0, { stiffness: 60, damping: 18, mass: 0.4 })
  const my = useSpring(0, { stiffness: 60, damping: 18, mass: 0.4 })
  const yScroll = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const scaleScroll = useTransform(scrollYProgress, [0, 1], [1, 1.05])

  useEffect(() => {
    if (reduce) return
    const onMove = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * -26)
      my.set((e.clientY / window.innerHeight - 0.5) * -26)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduce, mx, my])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* scroll layer — nudged right (x) so the monitor sits clear of the
          left-spine headline */}
      <motion.div
        className="absolute inset-[-12%]"
        style={reduce ? { transform: 'translateX(7%)' } : { x: '7%', y: yScroll, scale: scaleScroll }}
      >
        {/* mouse layer — the looping control-room clip drifts with scroll + cursor */}
        <motion.div className="h-full w-full" style={reduce ? undefined : { x: mx, y: my }}>
          <video
            className="h-full w-full object-cover"
            style={{ objectPosition: 'center 42%' }}
            autoPlay
            muted
            loop
            playsInline
            poster={asset('/clips/control.jpg')}
          >
            <source src={asset('/clips/control.webm')} type="video/webm" />
            <source src={asset('/clips/control.mp4')} type="video/mp4" />
          </video>
        </motion.div>
      </motion.div>

      {/* directional scrim — darkest at the left spine, clears toward the monitor */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to right, rgba(6,7,10,0.94), rgba(6,7,10,0.55) 36%, rgba(6,7,10,0.12) 70%, transparent)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, rgba(6,7,10,0.6), rgba(6,7,10,0) 42%)' }}
      />
    </div>
  )
}

/**
 * S0 · VOID / TITLE — the opening. Echo (ambient bone-ring ripple field) is the
 * locked direction; Studio (parallax control-room still) stays as a review
 * escape hatch via ?hero=studio in the URL.
 */
export function Hero({ start = true }: { start?: boolean }) {
  const reduce = useReducedMotion()
  // locked to ECHO; ?hero=studio is the only thing that flips this (review hatch).
  const [variant] = useState<Variant>(initialVariant)
  // the intro plays once the loader lifts (start) so the epic entrance happens
  // while the visitor is actually looking at it — never hidden behind the loader.
  const go = start || !!reduce
  const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  // park the Echo WebGL loop once the hero scrolls away (it renders forever
  // otherwise — a 60fps GPU drain below the fold). A small margin keeps it warm
  // just off-screen so it's running before the hero is fully back in view.
  const heroInView = useInView(sectionRef, { margin: '20% 0px 20% 0px' })

  const isStudio = variant === 'studio'

  return (
    <section
      id="void"
      ref={sectionRef}
      className={`relative flex min-h-[100dvh] flex-col justify-center overflow-hidden ${
        isStudio ? '' : 'items-center text-center'
      }`}
    >
      {/* background variant — the Echo field BLOOMS in (light emerging from the
          void) once the intro starts, rather than just appearing. */}
      <div className="absolute inset-0 z-0">
        {variant === 'studio' && <HeroStudio scrollYProgress={scrollYProgress} reduce={!!reduce} />}
        {variant === 'echo' && (
          <motion.div
            className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, scale: 1.08 }}
            animate={go ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 2.4, ease: EASE }}
          >
            {reduce ? (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(60% 50% at 50% 45%, rgba(241,161,90,0.10), transparent 70%)',
                }}
              />
            ) : (
              <Suspense fallback={null}>
                <EchoField active={heroInView} />
              </Suspense>
            )}
          </motion.div>
        )}
      </div>

      <Container className={`relative z-10 ${isStudio ? 'w-full text-left' : ''}`}>
        <WordsPullUp text="Midjourney Medical" className="label" start={go} delay={0.2} />

        {/* headline — a cinematic blur-up: rises and resolves from a soft blur as
            it scales to full, so it reads as forming out of the void. */}
        <motion.p
          className={`authored mt-6 ${isStudio ? 'max-w-[15ch]' : 'max-w-[18ch] mx-auto'}`}
          style={{
            fontSize: isStudio
              ? 'clamp(1.6rem, 3.4vw, 3.1rem)'
              : 'clamp(1.75rem, 5.4vw, 4.4rem)',
            color: 'var(--cream)',
          }}
          initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97, filter: 'blur(14px)' }}
          animate={go ? { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' } : undefined}
          transition={{ duration: 1.3, delay: 0.55, ease: EASE }}
        >
          {/* verbatim — Midjourney blogpost opening */}
          Something a little weird, a little crazy — but also spectacular, and filled with hope.
        </motion.p>

        {/* hairline — draws out from the centre after the headline settles */}
        <motion.div
          className={`mt-10 h-px w-16 ${isStudio ? '' : 'mx-auto'}`}
          style={{ background: 'var(--hairline)', transformOrigin: isStudio ? 'left' : 'center' }}
          initial={reduce ? false : { scaleX: 0, opacity: 0 }}
          animate={go ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.8, delay: 1.05, ease: EASE }}
        />
      </Container>

      {/* bottom fade — the Echo ripples dissolve into the void at the seam with
          BodyMorph below. Non-interactive (pointer-events-none) so it never
          blocks the Echo field's click ripples or the scroll cue. Sits above the
          bg canvas (z-0) and below the content/cue (z-10). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1]"
        style={{
          height: '28vh',
          background: 'linear-gradient(to bottom, transparent, var(--void))',
        }}
      />

      {/* scroll cue */}
      <motion.div
        className="pointer-events-none absolute bottom-10 left-1/2 z-10 -translate-x-1/2"
        initial={reduce ? false : { opacity: 0 }}
        animate={go ? { opacity: 1 } : undefined}
        transition={{ duration: 1.4, delay: 1.4 }}
      >
        <motion.div
          className="flex flex-col items-center gap-3"
          animate={reduce ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="label" style={{ fontSize: '0.625rem', opacity: 0.5 }}>
            Scroll
          </span>
          <span className="h-8 w-px" style={{ background: 'var(--hairline)' }} />
        </motion.div>
      </motion.div>
    </section>
  )
}
