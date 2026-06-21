import { ScaleOnScrollVideo } from '../anim/ScaleOnScrollVideo'
import { asset } from '../lib/asset'

/**
 * S1 · THE DESCENT (HERO, scalable video) — the compute-rack clip starts as a
 * small luminous rectangle in the void and scales to full-bleed on scroll. The
 * authored line fades in once it reaches full scale. (PRD §8 S1)
 */
export function Descent() {
  return (
    <section id="descent" className="relative">
      <ScaleOnScrollVideo
        src={asset('/clips/control_loop')}
        poster={asset('/clips/control.jpg')}
        track="200vh"
        overlay={
          <div className="flex h-full w-full items-end">
            <div
              className="w-full"
              style={{ paddingInline: 'var(--margin)', paddingBlock: 'clamp(40px, 8vh, 96px)' }}
            >
              <p
                className="authored max-w-[21ch]"
                style={{
                  fontSize: 'clamp(1.75rem, 4.5vw, 3.5rem)',
                  color: 'var(--cream)',
                  textShadow: '0 2px 40px rgba(6,7,10,0.8)',
                }}
              >
                {/* verbatim (faithfully trimmed) — Midjourney Medical announcement:
                    "...a compute cluster reconstructs the returning waves into
                    cross-sectional images of muscle, fat, bone and organs."
                    Dropped the trailing "in around 60 seconds" (repeated elsewhere
                    on the page). Fits the compute-rack / reconstruction visual. */}
                A compute cluster reconstructs the returning waves into images of muscle, fat, bone and organs.
              </p>
            </div>
          </div>
        }
      />
    </section>
  )
}
