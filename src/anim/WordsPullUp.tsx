import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

/**
 * WordsPullUp — split a heading by words; each word rises y:20→0 with a
 * 0.08s stagger when it scrolls into view (once). (PRD §7)
 */
export function WordsPullUp({
  text,
  className = '',
  stagger = 0.08,
  delay = 0,
}: {
  text: string
  className?: string
  stagger?: number
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const reduce = useReducedMotion()
  const words = text.split(' ')

  return (
    <span ref={ref} className={`inline-block ${className}`} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={reduce ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            animate={inView ? { y: 0, opacity: 1 } : undefined}
            transition={{
              duration: 0.7,
              delay: delay + i * stagger,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  )
}
