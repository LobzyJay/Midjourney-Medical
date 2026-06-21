import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { Mark } from './Mark'

/**
 * No menu — a single floating mark + hairline wordmark, top-left, Swiss style.
 * (HANDOFF §6.5)
 *
 * Auto-hide: shown over the hero; once past it, the header hides on scroll-down
 * and reveals on scroll-up (transform only — hardware-accelerated, cheap).
 */
export function Nav() {
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const last = useRef(0)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = last.current
    last.current = y
    // always visible while over the hero (first ~viewport)
    if (y < window.innerHeight * 0.8) {
      setHidden(false)
      return
    }
    if (y > prev + 4) setHidden(true) // scrolling down → hide
    else if (y < prev - 4) setHidden(false) // scrolling up → reveal
  })

  return (
    <motion.header
      className="fixed left-0 top-0 z-40 w-full mix-blend-difference"
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className="flex items-center"
        style={{ paddingInline: 'var(--margin)', paddingBlock: '20px' }}
      >
        <a
          href="#void"
          className="flex items-center gap-2.5 transition-opacity duration-300 ease-out [@media(hover:hover)]:hover:opacity-70"
          style={{ color: 'var(--cream)' }}
        >
          <Mark className="h-[18px] w-auto" />
          <span className="label" style={{ color: 'var(--cream)' }}>
            Midjourney&nbsp;Medical
          </span>
        </a>
      </div>
    </motion.header>
  )
}
