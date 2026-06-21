import { useEffect, useState } from 'react'

/**
 * Toggle the Swiss debug grid overlay.
 * Enable with `?grid` in the URL, or press the "g" key during build.
 */
export function useDebugGrid(): boolean {
  const [on, setOn] = useState(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('grid'),
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore when typing in a field
      const t = e.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return
      if (e.key === 'g' || e.key === 'G') setOn((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return on
}
