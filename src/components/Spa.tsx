import { PinnedClip } from '../anim/PinnedClip'
import { Reveal } from '../anim/Reveal'
import { Container, Grid } from './Container'
import { asset } from '../lib/asset'

/**
 * S5 · THE MIDJOURNEY SPA — editorial Swiss/mono. The scanner, reframed as
 * somewhere you'd want to be. Real concept-render footage + copy from the
 * MJ Medical blogpost. Void surface, no glass here. (PRD §8 S5)
 */
export function Spa() {
  return (
    <section
      id="spa"
      className="relative py-24 md:py-32"
      style={{ borderTop: '1px solid var(--hairline)' }}
    >
      <Container className="relative z-10 w-full">
        <Grid>
          {/* heading + body — left spine */}
          <Reveal className="col-span-4 md:col-span-6 lg:col-span-7">
            <p className="label">The Midjourney Spa</p>
            <h2
              className="authored mt-4 max-w-[16ch]"
              style={{ fontSize: 'clamp(1.85rem, 4.5vw, 3.75rem)', color: 'var(--cream)' }}
            >
              {/* announcement-sourced: "as powerful as MRI, and as casual as a
                  trip to the spa" — moved here from Descent where it fits best. */}
              As powerful as MRI. As casual as a trip to the spa.
            </h2>
          </Reveal>

          <Reveal className="col-span-4 mt-6 md:col-span-6 md:mt-0 lg:col-span-5" delay={0.08}>
            <div className="space-y-6 font-mono text-[13px] leading-relaxed text-cream-dim md:text-sm">
              <p>The first Spa will be opening in the heart of San Francisco in 2027.</p>
              <p>
                Our spa will have hot tubs, saunas, cold plunges, and cozy rooms with pools of
                golden light which softly scan your body.
              </p>
            </div>
          </Reveal>
        </Grid>

        {/* the concept renders — wide editorial figure */}
        <Reveal as="figure" className="mt-14">
          <PinnedClip
            src={asset('/spa/spa_renders')}
            poster={asset('/spa/spa_renders.jpg')}
            formats={['mp4']}
            vignette={false}
            className="aspect-[21/9] w-full overflow-hidden rounded-lg md:aspect-[21/8]"
          />
          <figcaption className="label mt-4" style={{ opacity: 0.55 }}>
            Concept renders of the Midjourney Spa.
          </figcaption>
        </Reveal>

        {/* closing thought */}
        <Grid className="mt-14">
          <Reveal
            as="p"
            className="col-span-4 font-mono text-[13px] leading-relaxed text-cream-dim md:col-span-6 md:col-start-1 md:text-sm lg:col-span-7"
          >
            It should be a place you love going, whether it&apos;s by yourself, or with friends.
            It should be available 24/7. The scans are a side-effect — you barely think of them.
            But suddenly, you have a huge library of data about your health.
          </Reveal>
        </Grid>
      </Container>
    </section>
  )
}
