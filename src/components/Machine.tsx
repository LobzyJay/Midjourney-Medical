import { PinnedClip } from '../anim/PinnedClip'
import { Reveal } from '../anim/Reveal'
import { Container, Grid } from './Container'
import { asset } from '../lib/asset'

/** Diegetic readout rows — clinical label + mono value. */
const SPEC: { k: string; v: string }[] = [
  { k: 'Sensing elements', v: '≈ 500,000' },
  { k: 'Throughput', v: 'terabytes / sec' },
  { k: 'Descent rate', v: '5 cm / sec' },
  { k: 'Full scan', v: '60 s target' },
]

/**
 * S3 · THE MACHINE — the control-room clip plays pinned in view; an
 * instrument-glass HUD card floats over it with the device spec. Glass is
 * diegetic only — "you're looking through the instrument." (PRD §8 S3)
 */
export function Machine() {
  return (
    <section id="machine" className="relative" style={{ borderTop: '1px solid var(--hairline)' }}>
      <PinnedClip src={asset('/clips/machine')} className="h-[100dvh] w-full">
        <Container className="relative z-10 flex h-full w-full items-center">
          <Grid className="w-full items-center">
            {/* heading — clinical, left */}
            <Reveal className="col-span-4 md:col-span-3 lg:col-span-6">
              <p className="label">The Midjourney Scanner</p>
              <p
                className="authored mt-4 max-w-[16ch]"
                style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.75rem)', color: 'var(--cream)' }}
              >
                You go into the water, you come out of the water, and you&apos;re done.
              </p>
              <p className="mt-6 max-w-[34ch] font-mono text-[12px] leading-relaxed text-cream-dim md:text-[13px]">
                It starts by stepping into a shallow pool of golden light. The goal is for the
                whole process to take no more than 60 seconds.
              </p>
            </Reveal>

            {/* instrument-glass HUD card — right */}
            <Reveal
              className="col-span-4 mt-8 md:col-span-3 md:mt-0 lg:col-span-5 lg:col-start-8"
              delay={0.12}
            >
              <div className="instrument-glass p-6 md:p-8">
                <div className="mb-5 flex items-center justify-between">
                  <p className="label" style={{ color: 'var(--cream)' }}>
                    Live readout
                  </p>
                  <span className="font-mono text-[10px] tracking-wide text-cream-dim">
                    SYS · NOMINAL
                  </span>
                </div>
                <dl className="flex flex-col">
                  {SPEC.map((s, i) => (
                    <div
                      key={s.k}
                      className="flex items-baseline justify-between py-3"
                      style={{ borderTop: i === 0 ? 'none' : '1px solid var(--hairline)' }}
                    >
                      <dt className="label" style={{ letterSpacing: '0.16em' }}>
                        {s.k}
                      </dt>
                      <dd className="font-mono text-sm text-cream md:text-base">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </Reveal>
          </Grid>
        </Container>
      </PinnedClip>
    </section>
  )
}
