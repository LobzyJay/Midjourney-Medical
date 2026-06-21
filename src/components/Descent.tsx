import { ScaleOnScrollVideo } from '../anim/ScaleOnScrollVideo'

/**
 * S1 · THE DESCENT (HERO, scalable video) — descent clip starts as a small
 * luminous rectangle in the void and scales to full-bleed on scroll. The
 * authored line fades in once it reaches full scale. (PRD §8 S1)
 */
export function Descent() {
  return (
    <section id="descent" className="relative">
      <ScaleOnScrollVideo
        src="/clips/descent"
        track="200vh"
        overlay={
          <div className="flex h-full w-full items-end">
            <div
              className="w-full"
              style={{ paddingInline: 'var(--margin)', paddingBlock: 'clamp(40px, 8vh, 96px)' }}
            >
              <p
                className="authored max-w-[18ch]"
                style={{
                  fontSize: 'clamp(1.75rem, 4.5vw, 3.5rem)',
                  color: 'var(--cream)',
                  textShadow: '0 2px 40px rgba(6,7,10,0.8)',
                }}
              >
                {/* {{ADE-COPY}} */}
                As powerful as an MRI. As casual as a trip to the spa.
              </p>
            </div>
          </div>
        }
      />
    </section>
  )
}
