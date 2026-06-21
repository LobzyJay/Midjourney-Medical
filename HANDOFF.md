# HANDOFF → Claude Code
### Midjourney Medical — one-page site build

This folder is a self-contained brief. Build the site described in **`Website_PRD.md`** (source of truth). This file tells you what's here, the locked decisions, defaults for anything still open, and the exact build sequence so you can one-shot it.

---

## 0. Read first (in order)
1. **`Website_PRD.md`** — full spec. The §-numbers below refer to it.
2. **`Midjourney_Medical_Design_Dossier.html`** — brand/voice/visual reference (open in browser). Not prescriptive; context.
3. This file — execution plan + defaults.

## 1. What you're building
A single long-scroll, one-page React site for a spec/portfolio concept of **Midjourney Medical** (full-body ultrasound scanner + Midjourney Spa). Black-first "void" aesthetic; the only color is the gold the footage/light emits. Centerpiece is an interactive scroll-driven **particle morph: cells → labeled skeleton → full body** (PRD §8a). Swiss/International typographic arrangement throughout (PRD §6.2).

## 2. Stack (locked)
React 18 + Vite + TypeScript + Tailwind 3 + framer-motion + lucide-react + **three / @react-three/fiber / @react-three/drei / @react-three/postprocessing** (for the morph). Deploy: Vercel.

**Morph engine = fork the `LobzyJay/nodefield` repo's technique** (PRD §13). Reuse its GPU dual-buffer morph (nodes + fibers, `uMorph` shaders), its postprocessing (bloom/grain/vignette/ACES), and its telemetry layer (repurposed as anatomical labels). **Ignore nodefield's design system** — type/color/layout follow this PRD, not Constellation. Void = `#06070A`. Morph color = warm dark→gold→white. Strip leva for prod.

## 3. Skills to use
- `/visual-craft` — the §8a Three.js particle morph, shaders, performance budget.
- `/scroll-animations` + `/scroll-stop-builder` — scroll engine: pinned + scrubbed sections, scroll-progress → morph stage, pull-up & char-opacity reveals.
- `/emil-design-eng` — final polish + QA gate (easing, micro-interactions, hairline weights, perceived perf). Run before calling it done.

## 4. Asset inventory (in this folder)
| Path | What | Use |
|---|---|---|
| `announce.mp4` | 1440p master of the announcement film (142.6s) | cut section clips from this |
| `extract_frames.sh` | frame/clip pipeline (yt-dlp + ffmpeg) | re-pull or re-cut anytime |
| `frames/` | 20 keyframes + 46 timeline frames | reference / posters |
| `contact_sheets/` | keyframes.jpg, grid_timeline.jpg | scan the whole film fast |
| `inspo_mov/` | frames from the Avengers HUD recording + `sheet_time.jpg` | morph visual grammar (holographic anatomy) |
| `palette_swatch.png` | sampled palette | reference only (UI is void+cream; gold from footage) |

**Clips to cut** (commands in PRD §9): `descent.mp4` (0:12–0:30, hero), `machine.mp4` (0:40–0:50, S3), `void_detail.mp4` (0:06–0:12, S0 texture). Produce mp4 + webm + poster jpg for each → `public/clips/`.

**Still needed (not in folder):**
- `public/clips/` scan-slice + spa clips → download from CDN in-browser (URLs in dossier §11 / PRD), transcode.
- `public/models/skeleton.glb` + `body.glb` for the morph → see §6 default below.

## 5. Build sequence
1. Scaffold Vite + React + TS + Tailwind; add deps (framer-motion, lucide-react, three, @react-three/fiber, @react-three/drei).
2. Set up tokens + Swiss grid (PRD §6, §10): `--void #000`, `--cream #E7E3D4`, `--hairline`; fonts (Instrument Serif + grotesque); 12/6/4 col grid + baseline; `.instrument-glass`.
3. Cut clips (PRD §9) → `public/clips/`.
4. Build animation primitives (`anim/`): WordsPullUp, ScrollCharOpacity, ScaleOnScrollVideo, PinnedClip.
5. Build `ParticleMorph` (`three/`) **by porting nodefield's engine** (PRD §13): study `geometry.ts`/`Nodes.tsx`/`Fibers.tsx`/`Effects.tsx`/`Telemetry.tsx`; replace procedural `endpoint()` shapes with MeshSurfaceSampler targets (skeleton.glb, body.glb); add a 3rd buffer `aOffsetC` (or 2 sequential A→B passes) for cells→skeleton→body; scroll drives `uMorph`; keep bloom/grain/vignette/ACES; telemetry → anatomical labels. Gold LUT. Reduced-motion fallback = 3 crossfading stills.
6. Build sections in order (PRD §8 + §8a): Void → BodyMorph → Descent → Promise → Machine → WhatItSees → Spa → Join.
7. Responsive pass + `prefers-reduced-motion` + IntersectionObserver play/pause.
8. `/emil-design-eng` polish pass. Deploy preview to Vercel.

## 6. Defaults for OPEN questions (PRD §12) — proceed with these unless Adewale overrides
1. **Copy:** use the PRD placeholder lines; mark each `{{ADE-COPY}}` so they're easy to find and swap. Don't lift MJ's exact copy.
2. **Grotesque:** **Archivo** (free, Google Fonts) as default; leave a one-line swap point for Suisse Int'l if licensed.
3. **Hero scroll:** scale-on-scroll only (no frame-scrubbing) for v1.
4. **Credit:** MJ-branded pastiche; **no** Layout Studio / personal name on the page (per Adewale's rule). Add a tiny `// concept by` comment in code only.
5. **Nav:** no menu — a single floating hairline wordmark, top-left, Swiss style.
6. **Sound:** muted by default; add an ambient on/off toggle (hairline, bottom-right).
7. **Spa depth:** one render loop for v1; floor plan/map = v2.
8. **Section order:** as in step 6 above (morph before descent).
9. **Morph models:** default to a CC0 skeleton + body from Sketchfab/Z-Anatomy; decimate to ≤40k sampled points. If unavailable, fall back to: cells → a point-sampled generic humanoid (MakeHuman export) for both skeleton-ish and body stages, visually differentiated by density/labels.
10. **nodefield:** source is `github.com/LobzyJay/nodefield`. Reuse the ENGINE/technique only (PRD §13); ignore its design system. Void `#06070A` adopted.
11. **Morph color:** particles **dark→gold→white** single-hue (light forming). Not nodefield's cool spectrum.

## 7. Kickoff prompt (paste into Claude Code at the repo root)
```
Read HANDOFF.md, then Website_PRD.md. Build the one-page Midjourney Medical site exactly as specified.
Use the skills /visual-craft (the §8a particle morph), /scroll-animations + /scroll-stop-builder
(scroll engine), and /emil-design-eng (final polish). Follow the §6 defaults in HANDOFF.md for any
open question — do not stop to ask. Scaffold the Vite project, cut the clips per PRD §9, build all
sections in order, then run the emil-design-eng polish pass and give me a Vercel-ready build.
Flag every placeholder copy line as {{ADE-COPY}}.
```

## 8. Definition of done
Runs locally (`npm i && npm run dev`), deploys to Vercel, all 8 sections present, morph works + has reduced-motion fallback, Swiss grid holds at all breakpoints, only color on screen is footage/particle gold, passes an /emil-design-eng review.
