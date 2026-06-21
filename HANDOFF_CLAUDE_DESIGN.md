# Midjourney Medical — Handoff (for iteration in claude.design)

A single long-scroll, one-page React site for the *Midjourney Medical* concept (the
scanner + spa announcement). Black-first "void" aesthetic — the **only color is the
gold the footage/particles emit**, plus subtle per-section accent washes. Swiss /
International typographic system. Centerpiece is a scroll-driven **GPU particle morph**:
cells → real human skeleton → **neural-network body**.

**Status:** fully built, 9 sections, real Midjourney assets + copy, responsive,
reduced-motion safe, production build clean (0 console errors). **Not yet committed to
git** (repo is `git init`-ready but untracked). Live-tested via Vite dev server.

---

## Run it

```bash
npm install
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # tsc + vite build → dist/  (clean)
npm run preview  # serve the production build
```

Node 24, npm 11. No env vars, no backend. Deploy = static (`dist/`); `vercel.json` is present.

---

## Stack

- **React 18 + Vite + TypeScript + Tailwind 3**
- **framer-motion** — all DOM animation (scroll, pull-up text, char-opacity, scale-on-scroll, fades)
- **three + @react-three/fiber + drei + @react-three/postprocessing** — the particle morph
- **lucide-react** — icons
- Fonts via Google Fonts (`index.html`): **Instrument Serif** (authored voice),
  **Archivo** (clinical voice), **JetBrains Mono** (diegetic readouts / editorial body)

---

## Design system (`src/index.css`)

CSS custom properties mirror Tailwind tokens. Core:

| Token | Value | Use |
|---|---|---|
| `--void` | `#06070A` | background, the subject |
| `--cream` | `#E7E3D4` | type |
| `--cream-dim` | `rgba(231,227,212,.6)` | secondary type |
| `--hairline` | `rgba(231,227,212,.10)` | 1px borders/dividers |
| `--ease-void` | `cubic-bezier(0.16,1,0.3,1)` | the house easing |

**Two type voices** (never mixed within a gesture):
- `.authored` — Instrument Serif, the one human line per section. **Upright, not italic** (user preference — do not re-introduce italics; see `memory/no-italics`).
- `.label` — Archivo, 11px, uppercase, wide tracking — clinical labels/tags.
- `font-mono` (JetBrains Mono) — diegetic readouts + editorial body copy in the Swiss sections.

**Color "sauce"** — the only color beyond gold. `--glow-warm / --glow-cool / --glow-violet / --glow-teal` (RGB triplets), applied ONLY through [`SectionGlow.tsx`](src/components/SectionGlow.tsx) as low-opacity radial washes for a warm↔cool temperature rhythm. Hero / morph / Descent / Machine stay pure void+gold.

Other utilities in `index.css`: `.instrument-glass` (diegetic glass panels), `.noise` (grain overlay), `.void-breath` (radial floor glow), Swiss debug-grid overlay (toggle with `?grid` or the `g` key — see `src/lib/useDebugGrid.ts`), `prefers-reduced-motion` rules.

---

## Sections (order is the narrative; `src/App.tsx`)

`BodyMorph` is lazy-loaded (code-split, see Perf). Each section is `position: relative`; content sits at `z-10` above any `SectionGlow`.

| # | id | Component | What it is | Asset / primitive |
|---|---|---|---|---|
| S0 | `void` | `Hero` | Void open, wordmark + serif line, scroll cue | `WordsPullUp` |
| S1a | `body` | `BodyMorph` | **The particle morph centerpiece** (pinned, scroll-scrubbed) | `three/*` |
| S1 | `descent` | `Descent` | Hero scalable video, grows to full-bleed | `ScaleOnScrollVideo` + `/clips/descent` |
| S2 | `promise` | `Promise` | Manifesto line, char-by-char reveal | `ScrollCharOpacity` |
| S3 | `machine` | `Machine` | Control-room clip + instrument-glass spec HUD | `PinnedClip` + `/clips/machine` |
| S3a | `closer` | `LookingCloser` | Editorial Swiss/mono — swept scan volumes + the machine's numbers | `/scan/body_slice`,`leg_slice` |
| S4 | `sees` | `WhatItSees` | Real raw↔segmentation slice crossfade carousel | `/scan/*_raw`/`*_seg` webp |
| S5 | `spa` | `Spa` | Editorial — concept-render triptych + invitation copy | `/spa/spa_renders` |
| S6 | `join` | `Join` | CTA close, real Sign Up (typeform) + Discord links | — |

Copy is the **real Midjourney blogpost wording** throughout (the user chose verbatim). The Nav wordmark links `#void`.

---

## The particle morph (`src/three/`)

The hero interaction. GPU-instanced billboard points morph across **three position
buffers** as a scroll-driven `uMorph` runs 0 → 1 → 2.

**Files:**
- `humanPoints.ts` — procedural geometry + `buildMorphStages(count)` returns `{cells, skeleton, body, seed}` Float32 buffers. Also `buildBodyEdges()` (neural-net edges) and `BODY_NODE_COUNT`. Body is sampled as a **surface shell**, not a filled volume.
- `morphShader.ts` — point vertex/fragment shaders. 3-stage lerp, organic drift that settles by the skeleton stage, gold LUT color, crisp sharp-edged dots, and the **node-condense** at the body stage (non-node points fade, leaving the neural net).
- `morphLineShader.ts` — the connection-line shader (the neural web). Lines morph with the points but only fade in as the body forms.
- `goldLUT.ts` — the dark-ember → gold → warm-white ramp. **The only color the particles emit.**
- `Effects.tsx` — postprocessing: bloom (restrained), ACES tone-mapping, grain, vignette.
- `ParticleMorph.tsx` — the `<Canvas>`: builds point + line geometry, drives uniforms, budgets point count + DPR per device, parks the render loop offscreen (`frameloop`), and progressively swaps in the real skeleton.
- `BodyMorph.tsx` (in `components/`) — the pinned section wrapper: scroll → `uMorph`, stage labels (`MATTER` / `STRUCTURE` / `THE WHOLE`), HUD brackets, anatomical leader-labels, reduced-motion fallback (3 stated stages, no WebGL).

**The three stages:**
1. **MATTER** — loose drifting point cloud.
2. **STRUCTURE** — a **real human skeleton**. Sampled offline from the user's anatomy model into `public/models/skeleton.bin` (24k points, 281 KB, Float32 xyz). Fetched at runtime and swapped into the skeleton buffer; if the file is absent it falls back to a procedural skeleton. Baked by `scripts/bake-skeleton.mjs` (parses an OBJ, area-weighted surface sampling, normalizes to the morph frame). **To re-bake or swap models:** `node scripts/bake-skeleton.mjs <input.obj> <count>`.
3. **THE WHOLE** — a **neural-network body**: ~2,600 of the points act as nodes connected by edges; the rest of the fill dissolves so the node+edge web reads as the figure.

**Common tweaks:**
- Web density / strands → `buildBodyEdges` args in `humanPoints.ts` (`nodeCount`, `knn`, `radius`) and `BODY_NODE_COUNT`.
- Web brightness → `uLineOpacity` in `ParticleMorph.tsx` (currently `0.5`).
- How aggressively the fill dissolves at the body stage → `nonNode` mix in `morphShader.ts` frag.
- Dot crispness / glow → dot `smoothstep` in `morphShader.ts` frag + Bloom in `Effects.tsx`.
- Point budget → `useMorphBudget()` in `BodyMorph.tsx` (9k/16k/24k mobile/tablet/desktop, ≤40k cap).
- **No mouse interaction** — the cursor-warp was removed deliberately; don't re-add.
- **Optional `public/models/body.glb`→`body.bin`** would upgrade the final stage to a real body mesh (pipeline already wired; not provided yet).

---

## Animation primitives (`src/anim/`)

All reduced-motion aware, all on `--ease-void`.
- `WordsPullUp` — heading words rise + stagger in (once, on view).
- `ScrollCharOpacity` — per-character opacity tied to scroll. **Word-aware** (words wrap, chars animate inside) — do not revert to per-char-only or the line overflows.
- `ScaleOnScrollVideo` — small rounded video grows to full-bleed on scroll; pauses offscreen.
- `PinnedClip` — a clip that plays only in view (IntersectionObserver). Options: `vignette`, `formats` (skip `.webm` 404s on mp4-only assets), `objectPosition`.

---

## Assets (`public/`) + provenance

All self-hosted (no hotlinking). Pulled from the official MJ Medical CDN
(`cdn.midjourney.com/static/medical/...`), which is Cloudflare-protected — `curl` is
blocked, but a real browser session can fetch them. They were retrieved by driving a
browser past the challenge and POSTing bytes to a tiny local receiver.

- `clips/` — `descent`, `machine`, `void_detail` (mp4+webm+jpg), cut from `announce.mp4` via `scripts/cut-clips.sh` (ffmpeg).
- `scan/` — 4 real raw↔segmentation slice pairs (`*_raw.webp` / `*_seg.webp`, labeled HUD baked in) + `body_slice` / `leg_slice` swept-volume videos (webm + poster).
- `spa/` — `spa_renders` concept-render triptych (mp4 + poster).
- `models/skeleton.bin` — baked skeleton point cloud (see morph section).

Source raw masters (`announce*.mp4`, `announce.f140.m4a`, `frames/`, `contact_sheets/`,
`inspo_mov/`, the design dossier) live at repo root — reference/source, not needed by the
build. The original brief is `Website_PRD.md` + `HANDOFF.md`.

---

## Responsive & performance

- **Code-split:** Three.js is isolated in the lazy `BodyMorph` chunk (~908 KB) so the
  initial bundle is **~289 KB JS / 94 KB gzip** and the hero paints immediately.
- Morph: point count + DPR budgeted per device; render loop parked when offscreen.
- All videos: muted, `playsInline`, paused offscreen.
- Baked skeleton (281 KB binary) instead of an 8.9 MB GLB + runtime sampling.
- Grid holds 12 / 6 / 4 cols (desktop / tablet / mobile); hero type uses `clamp()`.
- `prefers-reduced-motion` everywhere (morph → 3 stated stills, videos → static).

---

## Known issues / open items

- **Git:** repo is untracked. When committing: suggest gitignoring the ~55 MB raw
  `announce*` masters (the build only needs the cut clips). `.gitignore` already excludes
  scratch screenshots, `node_modules`, `dist`, `nodefield-ref`, `.playwright-mcp`.
- One **benign** console warning from framer-motion's `useScroll` (first-mount scroll
  measurement) — all targets are `position: relative`; scroll works; harmless.
- The skeleton model is a **T-pose** (arms out); the body is A-pose (arms down), so the
  arms move between those stages. Looks intentional; a posed/rigged skeleton GLB would
  remove the motion if undesired.
- `placeholder` flags `{{ADE-COPY}}` / `{{ADE-ASSET}}` were retired — copy/assets are real now.

---

## Good first iterations in claude.design

- **Tune the color rhythm** — adjust `SectionGlow` `rgb`/`opacity`/`at` per section, or the `--glow-*` tokens. Currently: Promise=violet, LookingCloser=cool, WhatItSees=teal, Spa+Join=warm.
- **Tune the neural net** — node count, connections, line/dot brightness (see morph tweaks above).
- **Copy / layout polish** on any section component in `src/components/`.
- **Add a section** — make a component in `src/components/`, drop it into the ordered list in `src/App.tsx`, give it an `id`, reuse a primitive + `Container`/`Grid`.
- **Swap the clinical grotesque** — one line in `tailwind.config.js` (`fontFamily.grotesque`) + the `index.html` font link (e.g. to Suisse Int'l if licensed).
