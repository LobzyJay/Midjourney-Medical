# Midjourney Medical

An immersive, single-page concept site for **Midjourney Medical** — the 60-second
full-body *Ultrasonic CT* scanner and the Midjourney Spa. A spec / portfolio
build by **Layout Studio**, designed to prove immersive-experience capability.

> Concept and pastiche, made for design iteration — not affiliated with or
> endorsed by Midjourney. Copy is drawn from the public Medical announcement.

## The idea

**Black is the subject.** The whole page is one long scroll through the void;
the only colour is the warm thermal light the imagery emits. Scroll is the
projector — motion is driven by scroll position, calm and weighted.

The centrepiece is a scroll-scrubbed WebGL morph: a cloud of particles assembles
into a translucent human figure that holds as a labelled anatomy diagram, then
comes fully to life. Typography runs two voices — an authored serif for the
human lines, a clinical grotesque set the Swiss way for everything else.

### Section flow

`Void / Hero → Body morph → Descent ("as powerful as an MRI") → Promise →
Machine → Looking Closer → What It Sees → Spa → Join`

## Tech

- **React 18 + Vite + TypeScript**
- **Tailwind CSS** for styling, design tokens in `src/index.css`
- **Framer Motion** — scroll-linked reveals, parallax, pinned/scrubbed sections
- **Three.js + @react-three/fiber + drei** — the particle / anatomy morph centrepiece
- Deployed on **Vercel**; also publishable to **GitHub Pages** (see below)

## Local development

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build to dist/
npm run preview  # preview the production build locally
```

Add `?hero=studio` to the URL for the alternate hero treatment, or `?grid` /
press `g` to toggle the Swiss layout grid during development.

## Project structure

```
src/
  components/   page sections (Hero, BodyMorph, Descent, Machine, …)
  anim/         scroll/reveal primitives (Reveal, PinnedClip, ScaleOnScrollVideo)
  three/        WebGL — ParticleMorph, shaders, figureFit (shared camera config)
  lib/          helpers (asset() — base-aware public paths)
  index.css     design tokens, base styles
public/         media — clips, scan slices, spa renders, 3D meshes
scripts/        asset prep (bake-skeleton point cloud, cut clips with ffmpeg)
```

## Deployment

The same build serves from a domain root **or** a subpath — public asset paths
go through `asset()` (`src/lib/asset.ts`), which prefixes Vite's `BASE_URL`.

**Vercel** (root) — import the repo; it auto-detects Vite and `vercel.json`
(build, output, and long-cache headers for media).

**GitHub Pages** (project subpath) — `.github/workflows/deploy-pages.yml` builds
with `--base=/<repo>/` and deploys on every push to `main`. Enable it once under
**Settings → Pages → Source → GitHub Actions**.
