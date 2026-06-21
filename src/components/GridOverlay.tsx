import { useEffect, useState } from 'react'

/** Visualizes the active column count (4 / 6 / 12) at the current breakpoint. */
function useColumns(): number {
  const [cols, setCols] = useState(12)
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth
      setCols(w >= 1024 ? 12 : w >= 768 ? 6 : 4)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return cols
}

export function GridOverlay() {
  const cols = useColumns()
  return (
    <div className="grid-overlay" style={{ ['--cols' as string]: cols }}>
      {Array.from({ length: cols }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  )
}
