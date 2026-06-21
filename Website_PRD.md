# Midjourney Medical — Website PRD
### Spec/portfolio landing concept · Layout Studio · v0.1 (living draft — still grilling)

> Purpose of this doc: get every decision pinned down so the build is **one-shot**, not back-and-forth. Anything still open is parked in §12. Nothing gets built until this is signed off.
>
> **Format: one-pager.** A single long-scroll page. No routing, no sub-pages. The interactive body-morph (§8a) is the centerpiece.

---

## 1. Problem & why now
Adewale needs a spec/portfolio landing concept for **Midjourney Medical** (the full-body Ultrasonic CT scanner + the Midjourney Spa) that proves immersive-experience capability. The brand is cinematic, hopeful, and built on one image: **light emerging from darkness, sound and water, 60 seconds.** The site has to feel like that, not describe it.

## 2. Core idea (the spine)
**Black is the subject.** Pure black is the void; everything that appears is "joined from the void." The site is a single long-scroll page where the **only color is the gold the footage itself emits** — no decorative gradients, no brand-colored UI. The hero is a **scalable video**: it starts as a small luminous rectangle in black and scales to full-bleed as you scroll. Sections surface from the dark beneath it.

This is grounded, not arbitrary: ~54% of every sampled frame of the announcement film is already near-black. The gold only reads as *light* because of the surrounding void.

**The centerpiece** is an interactive, scroll-driven morph: a cloud of cell/atom-like particles assembles out of the void into a **labeled human skeleton** (biology-diagram-as-interface), then morphs again into a **full adult human body** — the thing the scanner sees. It is light literally forming a body from nothing.

## 3. Goals & success criteria
- Feels cinematic and "alive from nothing" within the first 3 seconds (black → light arrives).
- Scroll is the projector: motion is driven by scroll position, calm and weighted (no snappy UI).
- Two distinct typographic voices are legible and intentional (authored vs clinical).
- Footage is ours (cut from the announcement film + official galleries), not stock or the inspo's CDN clips.
- Runs as a real, deployable project (Vercel) and degrades gracefully on mobile.
- **Done = a developer/agent can build it from this doc with no further questions.**

## 4. Scope
**In:** one responsive long-scroll page; scroll-scale hero video; scroll-linked text reveals; 7 sections; two-font system; surfaces system; clips cut from our master file; deploy-ready Vite repo.
**Out (v1):** backend, real form submission, multi-page routing, CMS, the spa floor-plan deep dive, i18n, analytics. (Park for v2.)

## 5. Tech stack
- **React 18 + Vite + TypeScript + Tailwind CSS 3**
- **framer-motion** — all animation (pull-up text, scroll char-opacity, scale-on-scroll, fades)
- **lucide-react** — icons
- **Three.js + @react-three/fiber + drei** — the §8a particle-morph centerpiece (point-cloud morph, GPU points)
- Deploy target: **Vercel**. Repo runnable in VS Code (`npm i && npm run dev`).

### 5.1 Skills to build with
- **`/visual-craft`** — owns the §8a 3D/particle morph and any canvas/WebGL work (point clouds, shaders, morph targets, performance budget).
- **`/scroll-animations`** + **`/scroll-stop-builder`** — own the scroll engine: pinned/scrubbed sections, scroll-progress → morph-stage mapping, pull-up + char-opacity reveals.
- **`/emil-design-eng`** — final polish pass: easing curves, micro-interactions, the invisible details (timing, hairline weights, focus states, perceived performance).
- **`/emil-design-eng`** is the QA gate before "done."

## 6. Brand system

### 6.1 Color — minimal by design
| Token | Value | Use |
|---|---|---|
| `--void` | `#06070A` | global background, everything (nodefield's near-black blue — lets glows read) |
| `--cream` | `#E7E3D4` | primary text / hottest UI light |
| `--cream-dim` | `rgba(231,227,212,0.6)` | secondary text |
| `--hairline` | `rgba(231,227,212,0.10)` | borders, dividers |
| *gold* | — | **never a CSS value.** Only ever comes from video/imagery. |

Rule of thumb on screen at any moment: ~80% void, ~15% cream type, ~5% emitted gold (from footage). No gradients used as decoration.

### 6.2 Typography — two voices (LOCKED: Instrument Serif + clinical grotesque)
- **Authored voice — `Instrument Serif` (italic).** Adewale "joining directly": first-person manifesto lines, the emotional copy. Large, quiet, italic accents.
- **Clinical voice — a precise grotesque.** Medical/device register: labels, section tags, navigation, captions, numbers. Neutral, tight, technical.
  - Recommended free (Google Fonts): **Archivo** or **Inter** or **Hanken Grotesk**.
  - Paid upgrade if licensed: **Suisse Int'l** or **Aktiv Grotesk** (truest "device-label" feel).
- **Body** rides on the clinical grotesque (no third family needed).
- *Optional diegetic mono* for live scanner readouts/numbers only (e.g. `Geist Mono`/`JetBrains Mono`) — used as texture inside the machine section, not as a UI font.

Type pairing logic: warm authored serif vs cold clinical grotesque = the exact MJ Medical tension (human warmth meeting clinical precision).

**Arrangement — Swiss / International Typographic Style (LOCKED).** The grotesque is set the Swiss way and the whole page obeys it:
- **Strict column grid** (12-col desktop / 6-col tablet / 4-col mobile) with a consistent baseline grid; everything snaps to it.
- **Flush-left, ragged-right.** No centered blocks (the inspo's centered hero is dropped in favor of left-aligned). No justification.
- **Asymmetric balance** — type and the morph/video weighted off-center against open negative space, not mirrored.
- **Tight, rational hierarchy** — few sizes, big jumps between them; size + weight + position do the work, not decoration.
- **Grotesque-dominant**: labels, nav, captions, body all in the clinical grotesque, set small, with **wide letter-spacing + UPPERCASE** for labels/tags (e.g. `MATTER · STRUCTURE · THE WHOLE`).
- **Serif used sparingly** as the single off-grid gesture — the authored italic line per section, the one human break in an otherwise systematic page.
- Generous, mathematical margins; the void *is* the whitespace.

### 6.3 Surfaces — MIXED (LOCKED), but rule-based not random
Two surface treatments, each with a job:
- **Void surface (default):** transparent on black, **hairline** `1px` borders only. Used for ~everything: nav, content blocks, CTA. Things look like they're *surfacing from the dark*.
- **Instrument glass (diegetic only):** a restrained liquid-glass panel — used **only where it represents the machine/data** (the scanner HUD card, readout overlays, the "what it sees" data panels). Glass = "you're looking through the instrument." Never used decoratively elsewhere.

Restrained glass spec (darker, void-friendly version of the inspo's):
```css
.instrument-glass{
  background: rgba(255,255,255,0.015);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  box-shadow: inset 0 1px 1px rgba(255,255,255,0.06);
  border-radius: 1rem; position: relative; overflow: hidden;
}
/* hairline gradient edge, low opacity so it reads on black */
.instrument-glass::before{
  content:''; position:absolute; inset:0; border-radius:inherit; padding:1px;
  background:linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,0) 40%, rgba(255,255,255,0) 60%, rgba(255,255,255,.25));
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none;
}
```

### 6.4 References & what we take from each
- **Nodefield — `nodefield.vercel.app`** (the primary node-field reference) — a dark WebGL site (theme `#06070A`, near-black blue void) reading as a **connected-particle node field** drifting in dark space. Take: the *particle substrate* the morph rises from, and the dark-void treatment. ⚠️ *Not yet viewed live — Chrome extension was offline; confirm details in §12.*
- **Nodefield Oy** (nodefield.com, Finnish studio) — secondary: extreme minimalism, bold declarative **word-pairs** as headlines ("Innovative. Design. / Future. Technology."). Take: confidence, restraint, type-as-statement.
- **Holographic HUD clip** (Avengers Assemble screen recording) — translucent **wireframe globe**, a **ghostly human-figure hologram**, orbiting **tether/orbit rings**, tactical **grid with corner brackets + labels**. Take: the *visual grammar of the morph centerpiece* — anatomy rendered as a glowing holographic interface, not a render.
- **Prisma / Asme** (earlier inspo) — the animation idioms: pull-up words, scroll char-opacity, scale-on-scroll inset video, restrained glass.
- **MJ announcement film** — the actual footage + the void/gold light logic.

Synthesis: **Nodefield minimalism (the frame) + holographic HUD anatomy (the centerpiece) + MJ void/gold (the light).**

## 7. Motion system (borrowed idioms from the references, adapted)
- **`WordsPullUp`** — split heading by words, each `motion.span` rises `y:20→0`, stagger `0.08s`, `useInView({once:true})`. For titles.
- **`ScrollCharOpacity`** — body line where each character fades `0.2→1` tied to `useScroll` (`offset: ['start 0.8','end 0.2']`), char range `[i/n - 0.1, i/n + 0.05]`. For the manifesto promise.
- **`ScaleOnScrollVideo`** — hero video container scales (e.g. `scale 0.6→1`, `radius 2rem→0`) mapped to scroll progress over the first viewport. This is the "scalable video."
- **Section-pinned clips** — each footage section plays its own muted/looping clip when reached; gentle crossfade to black between loops (the Asme fade-loop trick).
- **Easing:** long durations (600–1200ms), ease-out `cubic-bezier(0.16,1,0.3,1)`. Everything calm and weighted. Nothing snaps.
- **`ParticleMorph`** (centerpiece, §8a) — a single GPU point cloud whose target positions are interpolated between three sampled states as scroll progresses: **cells/atoms → skeleton → full body**. Scroll progress 0→1 drives a uniform `uMorph`; particles lerp position + color. Holographic look: additive blending, hairline wireframe overlay, grid + corner-bracket HUD, anatomical labels that fade in per stage.
- **Reduced-motion:** respect `prefers-reduced-motion` — videos still show, scrubbing/scaling falls back to static full-bleed + simple fades; the morph falls back to 3 static stills (cells / skeleton / body) that crossfade.

## 8. Section-by-section spec

> Footage is cut from `announce.mp4` (the 1440p master, 142.6s). Timestamps below are from the 2-second frame grid. Spa/scan-slice sources are the official CDN files (catalogued in the dossier §11) — grabbed locally in-browser since CDN blocks scripted pulls.

**S0 · VOID / TITLE**
- Pure black. Centred. `WordsPullUp` on "Midjourney Medical" in clinical grotesque, small; one Instrument Serif italic line beneath: *"We start from nothing."* (placeholder — see §12). A single hairline. Nothing else. Scroll cue: faint.

**S1 · THE DESCENT (HERO, scalable video)**
- Footage: descent clip **~0:12–0:30** (platform → golden ring ignites → body lowers into water).
- `ScaleOnScrollVideo`: small rounded rect in black → full-bleed as you scroll. Noise overlay low opacity. Title overlay (Instrument Serif italic): *"As powerful as an MRI. As casual as a trip to the spa."* fades in at full scale.

**S1a · THE BODY — interactive morph (CENTERPIECE)** ⭐
- The hero interaction. A pinned, scroll-scrubbed section (tall scroll track, sticky canvas).
- **Stage 1 — Cells / atoms.** Particles drift in the void, loose and organic, faint glow. Label (clinical grotesque): `MATTER`. Serif aside: *"Everything starts as nothing in particular."*
- **Stage 2 — Skeleton (biology diagram).** Particles snap into a human skeleton, rendered as a **holographic anatomy diagram** — wireframe, grid, corner brackets, thin leader-lines to anatomical labels (cranium, sternum, femur…). Label: `STRUCTURE`. This is the Avengers-HUD grammar.
- **Stage 3 — Full adult body.** Skeleton fills out into a full standing human form (point-cloud surface), calm and whole. Label: `THE WHOLE`. Serif: *"…until you can finally see all of it."*
- Color: particles emit cream→gold (the only color); HUD lines hairline cream. Pure black field. Optional faint orbit/tether rings (from the clip) around the figure between stages.
- Tech: `@react-three/fiber` point cloud; positions sampled from 3 source meshes (atom scatter, skeleton GLB, body GLB) via `MeshSurfaceSampler`; scroll → `uMorph` uniform lerps between the 3 buffers; additive blend; bloom (drei `<EffectComposer>`).
- Source meshes needed (see §12): a skeleton model + a body model (CC0/licensed). Particle counts budgeted for mobile (≤ ~40k points, downscaled on small screens).

**S2 · THE PROMISE**
- Black. `ScrollCharOpacity` on the manifesto line(s): *"You want as much data about your health as you can get — as quickly, and as cheaply, as possible."* Authored serif + clinical sub-label "THE IDEA".

**S3 · THE MACHINE** (Adewale's favorite footage)
- Footage: control-room/desktop clip **~0:40–0:50** (operator, monitor wall) + macro sensor detail **~0:08**.
- Layout: pinned clip + an **instrument-glass** HUD card (diegetic glass) with clinical-grotesque spec lines: "≈500,000 elements · terabytes/sec · 5 cm/sec descent · 60s target." Mono numbers optional.

**S4 · WHAT IT SEES**
- Footage: scan slices / segmentation crossfade (CDN `body_slice_animation` webm + segmentation webp pairs).
- Instrument-glass framing. Caption clinical. The raw↔segmentation crossfade is the motion.

**S5 · THE SPA**
- Footage: `spa_renders_sidebyside` mp4 (CDN). Warm minimalism. Copy shifts to invitation/serif: *"A place you'd want to be, even if there was no scanner."* Void surfaces, no glass here.

**S6 · JOIN (CTA)**
- Emerge-from-black CTA. Cream pill button, hairline. Copy: *"We are all Midjourney."* Links: join / waitlist (visual only in v1). lucide arrow.

## 9. Clip-cutting plan (one-shot, runs at build time)
```bash
# from /mj_medical (announce.mp4 = 1440p master)
mkdir -p site_assets/clips
# S1 hero descent
ffmpeg -i announce.mp4 -ss 12 -to 30 -an -c:v libx264 -crf 20 -movflags +faststart site_assets/clips/descent.mp4
# S3 the machine
ffmpeg -i announce.mp4 -ss 40 -to 50 -an -c:v libx264 -crf 20 -movflags +faststart site_assets/clips/machine.mp4
# S0 macro detail (texture loop)
ffmpeg -i announce.mp4 -ss 6 -to 12 -an -c:v libx264 -crf 20 -movflags +faststart site_assets/clips/void_detail.mp4
# also produce webm variants for web (vp9) + poster stills
for c in descent machine void_detail; do
  ffmpeg -i site_assets/clips/$c.mp4 -an -c:v libvpx-vp9 -crf 34 -b:v 0 site_assets/clips/$c.webm
  ffmpeg -i site_assets/clips/$c.mp4 -frames:v 1 site_assets/clips/$c.jpg
done
```
Scan-slice + spa clips: download from CDN in-browser, drop into `site_assets/clips/`, transcode with the same loop.

## 10. Layout / responsive
- **Swiss grid throughout** (see §6.2): 12-col desktop / 6 tablet / 4 mobile, fixed gutters, baseline grid. A visible-on-request debug grid overlay during build.
- Long-scroll, single column spine; flush-left type set on the grid (e.g. headings span cols 1–8, copy cols 9–12), collapses cleanly to mobile.
- Hero text fluid `clamp()`; mobile keeps scale-on-scroll but caps blur/scrub cost.
- Touch: autoplay muted+playsInline; pinned sections use IntersectionObserver play/pause to save battery.

## 11. File structure (target)
```
src/
  components/ Hero.tsx  BodyMorph.tsx  Promise.tsx  Machine.tsx  WhatItSees.tsx  Spa.tsx  Join.tsx  Nav.tsx
  three/ ParticleMorph.tsx  morphShader.ts  sampleMesh.ts   (point cloud, MeshSurfaceSampler, uMorph)
  anim/ WordsPullUp.tsx  ScrollCharOpacity.tsx  ScaleOnScrollVideo.tsx  PinnedClip.tsx
  index.css (tokens, .instrument-glass, noise utils)  App.tsx  main.tsx
public/clips/*  public/models/ skeleton.glb  body.glb   index.html (font links)
tailwind.config.js (colors.void/cream, fontFamily.serif/grotesque)
```

## 12. Open questions (still grilling — fill these and it's one-shot)
1. **Final copy.** Placeholder manifesto lines above need your wording — especially S0 ("We start from nothing.") and S6. Want your own voice, not lifted MJ copy?
2. **Clinical grotesque pick:** Archivo / Inter / Hanken (free) vs licensed Suisse/Aktiv? Default = Archivo unless you say.
3. **Hero scroll mechanism:** scale-on-scroll (locked) — do you also want true frame-scrubbing on the descent, or is scale + autoplay enough?
4. **Is this MJ-branded or Layout-Studio-credited?** i.e. does your name/Layout Studio appear (portfolio framing) or is it a pure MJ pastiche?
5. **Nav:** do we even want a nav in a void site, or just scroll? (Leaning: a single floating hairline mark, no menu.)
6. **Sound:** optional muted-by-default ambient toggle? (On brand — "built on sound.")
7. **Spa section depth:** one render loop, or pull the floor plan + 300 Grant Ave map too?
8. **Length:** with the morph as centerpiece, is the order right? (Current: Void → Body-morph → Descent → Promise → Machine → What it sees → Spa → Join.) Or does the descent video come *before* the morph?
9. **Morph source models:** need a **skeleton.glb** and a **body.glb** (CC0/licensed — e.g. Sketchfab CC0, Z-Anatomy, MakeHuman export). Confirm sourcing, or I propose options. Anatomical label list to finalize.
10. **Nodefield (vercel) live look:** confirm whether it's connected-dots, flow-field, or solid particle morph — reconnect Chrome and I'll capture it, or describe what grabbed you (the motion? the dark? the connections?).
11. **Morph color:** particles cream→gold (light forming) vs cool holographic white-blue (truer to the Avengers clip). Leaning cream→gold to stay in the void/gold logic.

## 13. Engine technique transfer — nodefield → MJ holographic morph
**Decision:** reuse nodefield's *engineering*, not its design system. We take the morph engine and the postprocessing; we drop its mono/lowercase UI, its cool spectrum, and the Constellation visual language entirely.

### What we take (the technique)
- **GPU dual-buffer morph.** `buildField()` produces position arrays for **nodes** (`nodePos`) and **fiber segments** (`segStart/segEnd`), plus a parallel **B target** (`nodePosB`, `segStartB/EndB`). Shaders lerp `mix(A, B, uMorph)`. The morph is free on the GPU.
- **Nodes = the point cloud. Fibers = the wireframe / leader-lines.** This is exactly the Avengers holographic grammar (glowing points + thin additive threads + tactical lines).
- **Postprocessing stack** (`Effects.tsx`): bloom + film grain + vignette + ACES tonemapping. Keep all of it — "the glow is the brand."
- **Telemetry layer** (`Telemetry.tsx`): live readouts anchored to nodes → repurpose as **anatomical labels + scanner readouts** (Swiss grotesque/HUD, per §6.2).
- **Cursor interaction** (`uMouse`): keep the subtle tip-push so the body reacts to the pointer.

### What we change for the morph (cells → skeleton → body)
- Replace the procedural `endpoint()` shapes with **mesh-sampled targets**: sample skeleton.glb and body.glb with `MeshSurfaceSampler` into the same Float32 buffers.
- The engine ships a 2-state morph (A→B). For **3 stages**, either: (a) add a third buffer `aOffsetC` + a two-segment `uMorph` (0→1→2), or (b) drive two sequential A→B passes, swapping the B target at the scroll midpoint. **Recommend (a)** — one clean scroll-driven uniform.
- Stage map: **cells** = a loose scatter/`sphere` shape (the engine's own `endpoint`) → **skeleton** mesh → **body** mesh.
- Color: ignore nodefield's spectrum. Use a warm **dark→gold→white single-hue** ramp so particles emit the MJ light (matches §6.1). Signal-green reserved only if we want a live "scan active" tick.

### What we discard
nodefield's JetBrains-Mono-everywhere lowercase whisper UI, the five cool star colors, the Constellation copy/voice, leva dev controls (strip for production). Type + layout follow the Swiss + serif system in §6.2/§10, not nodefield's.

### Files to study in the repo (`LobzyJay/nodefield`)
`src/lib/geometry.ts` (buildField, endpoint, FieldData) · `src/scene/Nodes.tsx` + `Fibers.tsx` (the `uMorph` shaders) · `src/scene/Effects.tsx` (postprocessing) · `src/scene/Telemetry.tsx` (readouts) · `src/lib/color.ts` (gradient LUT — swap to gold).

---
*Decisions locked so far: one-pager; void `#06070A`; reuse nodefield ENGINE/technique (GPU morph + postprocessing + telemetry) but IGNORE its design system; Swiss/International Typographic arrangement (grid, flush-left, grotesque-dominant); gold only from footage/light; Instrument Serif + clinical grotesque; mixed surfaces (void default, diegetic glass for machine/data); interactive particle-morph centerpiece (cells→skeleton→body); React+Vite+TS+Tailwind+framer-motion+lucide+three/r3f; built with /visual-craft + /scroll-animations + /scroll-stop-builder, polished by /emil-design-eng; footage cut from our master; PRD-first, one-shot build on sign-off.*
