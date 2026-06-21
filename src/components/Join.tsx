import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Container } from './Container'
import { Mark } from './Mark'

/**
 * S6 · JOIN (CTA) — emerge-from-black close. Cream hairline pill, authored
 * line, visual-only links. The last light before the void resumes. (PRD §8 S6)
 */
export function Join() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' })

  return (
    <section
      id="join"
      className="relative flex min-h-[100dvh] flex-col items-center justify-center text-center"
    >
      <Container className="relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <Mark className="mb-8 h-9 w-auto text-cream/80" />
          <p
            className="authored max-w-[12ch]"
            style={{ fontSize: 'clamp(2rem, 6.2vw, 5.2rem)', color: 'var(--cream)' }}
          >
            We are all Midjourney.
          </p>

          <p className="mt-8 max-w-[44ch] font-mono text-[12px] leading-relaxed text-cream-dim md:text-[13px]">
            Join our community, get updates, join our spa waitlist, or volunteer for upcoming
            clinical trials.
          </p>

          {/* cream hairline pill — real Sign Up link */}
          <a
            href="https://midjourney.typeform.com/to/eNqM4Gmp"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-10 inline-flex items-center gap-3 rounded-full border border-cream/30 px-7 py-3.5
                       transition-[border-color,transform] duration-300 ease-out
                       active:scale-[0.98] [@media(hover:hover)]:hover:border-cream/60"
          >
            <span className="label" style={{ color: 'var(--cream)', letterSpacing: '0.16em' }}>
              Sign Up
            </span>
            <ArrowRight
              size={15}
              className="transition-transform duration-300 ease-out [@media(hover:hover)]:group-hover:translate-x-1"
              style={{ color: 'var(--cream)' }}
            />
          </a>

          {/* secondary — real Discord link */}
          <a
            href="https://discord.gg/midjourney-medical"
            target="_blank"
            rel="noopener noreferrer"
            className="label mt-6 opacity-45 transition-opacity duration-300 ease-out [@media(hover:hover)]:hover:opacity-80"
          >
            Join our Discord
          </a>
        </motion.div>
      </Container>
    </section>
  )
}
