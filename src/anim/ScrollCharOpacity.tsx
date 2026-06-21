import { Fragment, useRef } from 'react'
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion'

/**
 * ScrollCharOpacity — each character fades 0.2→1 as the line scrolls through
 * the viewport, tied to scroll progress. For the manifesto promise. (PRD §7)
 *
 * Word-aware: characters are grouped into inline-block words with real spaces
 * between them, so the line wraps cleanly instead of running off the edge.
 */
function Char({
  char,
  range,
  progress,
}: {
  char: string
  range: [number, number]
  progress: MotionValue<number>
}) {
  const opacity = useTransform(progress, range, [0.2, 1])
  return (
    <motion.span style={{ opacity }} className="inline">
      {char}
    </motion.span>
  )
}

export function ScrollCharOpacity({
  text,
  className = '',
}: {
  text: string
  className?: string
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })

  if (reduce) {
    return (
      <p ref={ref} className={`relative ${className}`}>
        {text}
      </p>
    )
  }

  const total = text.length || 1
  const words = text.split(' ')
  let idx = 0 // running char index across the whole line

  return (
    <p ref={ref} className={`relative ${className}`} aria-label={text}>
      {words.map((word, wi) => {
        const chars = word.split('')
        const span = (
          <span className="inline-block whitespace-nowrap">
            {chars.map((c) => {
              const i = idx++
              return (
                <Char
                  key={i}
                  char={c}
                  range={[Math.max(0, i / total - 0.1), Math.min(1, i / total + 0.05)]}
                  progress={scrollYProgress}
                />
              )
            })}
          </span>
        )
        idx++ // count the space that followed this word
        return (
          <Fragment key={wi}>
            {span}
            {wi < words.length - 1 ? ' ' : null}
          </Fragment>
        )
      })}
    </p>
  )
}
