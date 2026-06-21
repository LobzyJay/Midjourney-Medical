import { motion, useReducedMotion, type Variants } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Scroll-reveal primitives — content fades + rises as it enters the viewport
 * (once). Use <Reveal> for a single block, or <RevealGroup> wrapping
 * <RevealItem>s for a staggered cascade. Emil-tuned: opacity + small y (never
 * scale(0)), strong ease-out, 30–80ms stagger; reduced-motion → appear, no move.
 */
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const VIEWPORT = { once: true, margin: '0px 0px -12% 0px' }

const TAGS = {
  div: motion.div,
  p: motion.p,
  h2: motion.h2,
  h3: motion.h3,
  span: motion.span,
  figure: motion.figure,
  figcaption: motion.figcaption,
  dl: motion.dl,
  li: motion.li,
} as const
type Tag = keyof typeof TAGS

export function Reveal({
  children,
  className,
  as = 'div',
  delay = 0,
  y = 18,
}: {
  children: ReactNode
  className?: string
  as?: Tag
  delay?: number
  y?: number
}) {
  const reduce = useReducedMotion()
  const Comp = TAGS[as]
  return (
    <Comp
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </Comp>
  )
}

export function RevealGroup({
  children,
  className,
  as = 'div',
  stagger = 0.07,
}: {
  children: ReactNode
  className?: string
  as?: Tag
  stagger?: number
}) {
  const reduce = useReducedMotion()
  const Comp = TAGS[as]
  const variants: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger } } }
  return (
    <Comp
      className={className}
      variants={variants}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </Comp>
  )
}

const ITEM: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export function RevealItem({
  children,
  className,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  as?: Tag
}) {
  const Comp = TAGS[as]
  return (
    <Comp className={className} variants={ITEM}>
      {children}
    </Comp>
  )
}
