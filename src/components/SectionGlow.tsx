/**
 * SectionGlow — a single low-opacity radial wash behind a section, the only
 * place color enters the void. Warm for human sections, cool/violet/teal for
 * the data sections, so the scroll has a temperature rhythm without ever
 * becoming "colorful." Sits behind content (give the content `relative z-10`).
 */
export function SectionGlow({
  rgb,
  at = '50% 60%',
  size = '90% 65%',
  opacity = 0.1,
  blend = 'screen',
  z = 0,
}: {
  /** one of the --glow-* triplets, e.g. 'var(--glow-warm)' */
  rgb: string
  /** gradient center, CSS position */
  at?: string
  /** gradient extent */
  size?: string
  opacity?: number
  blend?: 'screen' | 'normal'
  /** stacking order — raise above an opaque video, keep below content (z-10) */
  z?: number
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        zIndex: z,
        mixBlendMode: blend,
        background: `radial-gradient(${size} at ${at}, rgba(${rgb}, ${opacity}), transparent 72%)`,
      }}
    />
  )
}
