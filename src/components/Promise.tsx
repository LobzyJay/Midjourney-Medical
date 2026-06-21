import { ScrollCharOpacity } from '../anim/ScrollCharOpacity'
import { Container, Grid } from './Container'
import { SectionGlow } from './SectionGlow'

/**
 * S2 · THE PROMISE — black field. The manifesto line resolves character by
 * character as it scrolls through. Clinical sub-label anchors it. (PRD §8 S2)
 */
export function Promise() {
  return (
    <section
      id="promise"
      className="relative flex min-h-[100dvh] items-center"
      style={{ borderTop: '1px solid var(--hairline)' }}
    >
      <SectionGlow rgb="var(--glow-violet)" at="28% 64%" size="80% 70%" opacity={0.12} />
      <Container className="relative z-10 w-full">
        <Grid>
          <div className="col-span-4 md:col-span-6 lg:col-span-12">
            <p className="label">The Idea</p>
            <ScrollCharOpacity
              text="You want as much data as you can get about your health as quickly and as cheaply as possible."
              className="authored mt-8 max-w-[20ch] text-[length:clamp(1.75rem,4.5vw,3.5rem)]"
            />
          </div>
        </Grid>
        <p className="label mt-10" style={{ opacity: 0.35 }}>
          {/* {{ADE-COPY}} */}
        </p>
      </Container>
    </section>
  )
}
