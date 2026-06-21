import { motion, useReducedMotion } from 'framer-motion'
import { WordsPullUp } from '../anim/WordsPullUp'
import { Container } from './Container'

/**
 * S0 · VOID / TITLE — pure black, centered. The page begins from nothing.
 * Clinical wordmark rises in; one authored serif line beneath; a single
 * hairline and a faint scroll cue. Nothing else. (PRD §8 S0)
 */
export function Hero() {
  const reduce = useReducedMotion()

  return (
    <section
      id="void"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center text-center"
    >
      <Container>
        {/* clinical wordmark — small, wide-tracked */}
        <WordsPullUp
          text="Midjourney Medical"
          className="label"
          // slightly larger than the 11px base for the title moment
          // (kept clinical, not a display face)
        />

        {/* the one human break — authored serif */}
        <motion.p
          className="authored mx-auto mt-6 max-w-[20ch]"
          style={{ fontSize: 'clamp(1.75rem, 6vw, 3.75rem)', color: 'var(--cream)' }}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          A little weird, a little crazy — but spectacular, and filled with hope.
        </motion.p>

        {/* single hairline */}
        <div
          className="mx-auto mt-10 h-px w-16"
          style={{ background: 'var(--hairline)' }}
        />
      </Container>

      {/* faint scroll cue, bottom-center */}
      <motion.div
        className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
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
