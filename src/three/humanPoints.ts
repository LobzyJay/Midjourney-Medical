/**
 * Procedural point-cloud targets for the morph centerpiece.
 *
 * Three stages, all the SAME point count so the shader can lerp each particle
 * across buffers: cells (loose scatter) → skeleton (holographic anatomy) →
 * body (full standing figure).
 *
 * This is the §6-default-#9 fallback: a self-contained parametric humanoid
 * instead of fragile CC0 GLB downloads. To swap in real models later, replace
 * `sampleSkeleton` / `sampleBody` with MeshSurfaceSampler output of
 * skeleton.glb / body.glb — the rest of the pipeline is unchanged.
 *
 * Coordinate frame: y up, figure ~4 units tall (y ∈ [-2, 2]), facing +z.
 */

// ---- seeded RNG (mulberry32) — stable across reloads ----
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type V3 = [number, number, number]

const lerp = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]
function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
}
function norm(a: V3): V3 {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
// any vector perpendicular to d, plus its binormal
function basis(d: V3): [V3, V3] {
  const up: V3 = Math.abs(d[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0]
  const p1 = norm([
    up[1] * d[2] - up[2] * d[1],
    up[2] * d[0] - up[0] * d[2],
    up[0] * d[1] - up[1] * d[0],
  ])
  const p2 = norm([
    d[1] * p1[2] - d[2] * p1[1],
    d[2] * p1[0] - d[0] * p1[2],
    d[0] * p1[1] - d[1] * p1[0],
  ])
  return [p1, p2]
}

// ---- joint map (standing A-pose-ish, arms slightly out) ----
const J = {
  headTop: [0, 1.98, 0] as V3,
  head: [0, 1.7, 0] as V3,
  neck: [0, 1.46, 0] as V3,
  chest: [0, 1.18, 0.02] as V3,
  shoulderL: [-0.46, 1.38, 0] as V3,
  shoulderR: [0.46, 1.38, 0] as V3,
  elbowL: [-0.66, 0.82, 0.04] as V3,
  elbowR: [0.66, 0.82, 0.04] as V3,
  wristL: [-0.78, 0.28, 0.06] as V3,
  wristR: [0.78, 0.28, 0.06] as V3,
  handL: [-0.82, 0.12, 0.07] as V3,
  handR: [0.82, 0.12, 0.07] as V3,
  pelvis: [0, 0.18, 0] as V3,
  hipL: [-0.2, 0.06, 0] as V3,
  hipR: [0.2, 0.06, 0] as V3,
  kneeL: [-0.22, -0.92, 0.05] as V3,
  kneeR: [0.22, -0.92, 0.05] as V3,
  ankleL: [-0.2, -1.86, 0] as V3,
  ankleR: [0.2, -1.86, 0] as V3,
  footL: [-0.2, -1.96, 0.16] as V3,
  footR: [0.2, -1.96, 0.16] as V3,
}

interface Capsule {
  a: V3
  b: V3
  r: number // radius
  rb?: number // optional end radius (taper)
  w: number // sample weight
  shell?: boolean // sample surface only (vs filled)
  flat?: number // squash on z (torso is wider than deep)
}

/** Sample a point on/in a (possibly tapered) capsule. */
function sampleCapsule(c: Capsule, rnd: () => number): V3 {
  const t = rnd()
  const center = lerp(c.a, c.b, t)
  const r = (c.r + ((c.rb ?? c.r) - c.r) * t)
  const d = norm(sub(c.b, c.a))
  const [p1, p2] = basis(d)
  const ang = rnd() * Math.PI * 2
  // surface or filled
  const rad = c.shell ? r : r * Math.sqrt(rnd())
  const fz = c.flat ?? 1
  return [
    center[0] + (Math.cos(ang) * p1[0] + Math.sin(ang) * p2[0]) * rad,
    center[1] + (Math.cos(ang) * p1[1] + Math.sin(ang) * p2[1]) * rad,
    center[2] + (Math.cos(ang) * p1[2] + Math.sin(ang) * p2[2]) * rad * fz,
  ]
}

function sampleSphere(c: V3, r: number, shell: boolean, rnd: () => number): V3 {
  // uniform direction
  const u = rnd() * 2 - 1
  const th = rnd() * Math.PI * 2
  const s = Math.sqrt(1 - u * u)
  const dir: V3 = [s * Math.cos(th), u, s * Math.sin(th)]
  const rad = shell ? r : r * Math.cbrt(rnd())
  return [c[0] + dir[0] * rad, c[1] + dir[1] * rad * 1.12, c[2] + dir[2] * rad]
}

/** Pick an item by weight. */
function pick<T extends { w: number }>(items: T[], total: number, rnd: () => number): T {
  let x = rnd() * total
  for (const it of items) {
    x -= it.w
    if (x <= 0) return it
  }
  return items[items.length - 1]
}

// ============ BODY (full standing figure — fleshy capsules) ============
const BODY: Capsule[] = [
  { a: J.neck, b: J.chest, r: 0.13, w: 0.03, flat: 0.85 }, // neck
  { a: J.chest, b: J.pelvis, r: 0.34, rb: 0.26, w: 0.26, flat: 0.62 }, // torso
  { a: J.pelvis, b: [0, -0.05, 0], r: 0.27, w: 0.05, flat: 0.7 }, // hips
  // arms
  { a: J.shoulderL, b: J.elbowL, r: 0.12, rb: 0.09, w: 0.06 },
  { a: J.elbowL, b: J.wristL, r: 0.08, rb: 0.06, w: 0.05 },
  { a: J.shoulderR, b: J.elbowR, r: 0.12, rb: 0.09, w: 0.06 },
  { a: J.elbowR, b: J.wristR, r: 0.08, rb: 0.06, w: 0.05 },
  // legs
  { a: J.hipL, b: J.kneeL, r: 0.17, rb: 0.11, w: 0.1 },
  { a: J.kneeL, b: J.ankleL, r: 0.1, rb: 0.06, w: 0.08 },
  { a: J.hipR, b: J.kneeR, r: 0.17, rb: 0.11, w: 0.1 },
  { a: J.kneeR, b: J.ankleR, r: 0.1, rb: 0.06, w: 0.08 },
]

// ============ SKELETON (thin bones, ribcage arcs, skull shell) ============
const SKEL_BONES: Capsule[] = [
  { a: J.neck, b: J.pelvis, r: 0.035, w: 0.08 }, // spine
  { a: J.shoulderL, b: J.shoulderR, r: 0.025, w: 0.03 }, // clavicle line
  { a: J.shoulderL, b: J.elbowL, r: 0.028, w: 0.05 },
  { a: J.elbowL, b: J.wristL, r: 0.024, w: 0.045 },
  { a: J.shoulderR, b: J.elbowR, r: 0.028, w: 0.05 },
  { a: J.elbowR, b: J.wristR, r: 0.024, w: 0.045 },
  { a: J.hipL, b: J.hipR, r: 0.03, w: 0.03 }, // pelvis bar
  { a: J.hipL, b: J.kneeL, r: 0.035, w: 0.07 },
  { a: J.kneeL, b: J.ankleL, r: 0.03, w: 0.06 },
  { a: J.hipR, b: J.kneeR, r: 0.035, w: 0.07 },
  { a: J.kneeR, b: J.ankleR, r: 0.03, w: 0.06 },
]

function sampleSkeleton(rnd: () => number): V3 {
  const r = rnd()
  // skull shell
  if (r < 0.1) return sampleSphere(J.head, 0.23, true, rnd)
  // ribcage: stacked elliptical arcs around the chest
  if (r < 0.32) {
    const lvl = rnd()
    const y = 0.65 + lvl * 0.55
    const rx = 0.34 - lvl * 0.08
    const rz = 0.22 - lvl * 0.05
    // front+side arc only (open back reads as ribs)
    const ang = (-0.5 + rnd() * 1.9) * Math.PI
    return [Math.cos(ang) * rx, y, 0.02 + Math.sin(ang) * rz]
  }
  // hands / feet small clusters
  if (r < 0.36) return sampleSphere(rnd() < 0.5 ? J.handL : J.handR, 0.06, false, rnd)
  if (r < 0.4) return sampleSphere(rnd() < 0.5 ? J.footL : J.footR, 0.07, false, rnd)
  // bones
  const total = SKEL_BONES.reduce((s, c) => s + c.w, 0)
  return sampleCapsule({ ...pick(SKEL_BONES, total, rnd), shell: false }, rnd)
}

// Joint spheres bridge the gaps between limb capsules so the figure reads as a
// continuous body, not segmented "rigged-bot" parts. (interim, until a real
// body mesh is baked into body.bin like the skeleton)
const BODY_JOINTS: { c: V3; r: number }[] = [
  { c: J.neck, r: 0.13 },
  { c: J.shoulderL, r: 0.16 },
  { c: J.shoulderR, r: 0.16 },
  { c: J.elbowL, r: 0.1 },
  { c: J.elbowR, r: 0.1 },
  { c: J.wristL, r: 0.075 },
  { c: J.wristR, r: 0.075 },
  { c: J.hipL, r: 0.17 },
  { c: J.hipR, r: 0.17 },
  { c: J.kneeL, r: 0.13 },
  { c: J.kneeR, r: 0.13 },
  { c: J.ankleL, r: 0.085 },
  { c: J.ankleR, r: 0.085 },
]

// The body samples the SURFACE (shell) of each form, not the filled volume —
// a node lattice that reads as a neural-network skin once edges connect it.
function sampleBody(rnd: () => number): V3 {
  const r = rnd()
  if (r < 0.07) return sampleSphere(J.head, 0.26, true, rnd)
  if (r < 0.09) return sampleSphere(rnd() < 0.5 ? J.handL : J.handR, 0.08, true, rnd)
  if (r < 0.11) return sampleSphere(rnd() < 0.5 ? J.footL : J.footR, 0.09, true, rnd)
  // joints — bridge limb segments so nothing looks disconnected
  if (r < 0.3) {
    const j = BODY_JOINTS[(rnd() * BODY_JOINTS.length) | 0]
    return sampleSphere(j.c, j.r, true, rnd)
  }
  const total = BODY.reduce((s, c) => s + c.w, 0)
  return sampleCapsule({ ...pick(BODY, total, rnd), shell: true }, rnd)
}

export interface MorphStages {
  count: number
  cells: Float32Array // stage 0
  skeleton: Float32Array // stage 1
  body: Float32Array // stage 2
  seed: Float32Array // per-particle 0..1 (color/size variety)
}

export function buildMorphStages(count: number, seed = 1337): MorphStages {
  const rnd = mulberry32(seed)
  const cells = new Float32Array(count * 3)
  const skeleton = new Float32Array(count * 3)
  const body = new Float32Array(count * 3)
  const seedArr = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    // stage 0 — loose organic scatter in an ellipsoidal cloud, drifting
    const cloud = sampleSphere([0, 0.1, 0], 2.6, false, rnd)
    cells[i * 3] = cloud[0] * 1.25
    cells[i * 3 + 1] = cloud[1] * 1.4
    cells[i * 3 + 2] = cloud[2] * 0.9

    const s = sampleSkeleton(rnd)
    skeleton[i * 3] = s[0]
    skeleton[i * 3 + 1] = s[1]
    skeleton[i * 3 + 2] = s[2]

    const b = sampleBody(rnd)
    body[i * 3] = b[0]
    body[i * 3 + 1] = b[1]
    body[i * 3 + 2] = b[2]

    seedArr[i] = rnd()
  }

  return { count, cells, skeleton, body, seed: seedArr }
}

/**
 * Build the neural-network web of the final form. Connecting ALL points gives
 * edges too short to see (neighbours sit on top of each other), so we take a
 * SPARSE subset of nodes — the first `nodeCount` particles, which are randomly
 * ordered and so spread evenly over the body — and link each to its `knn`
 * nearest neighbours within `radius`. That yields visibly long strands: a
 * constellation/neural lattice over the figure. Cheap, runs once at load.
 *
 * Indices returned are real particle indices, so the lines morph with the dots.
 * Returns a flat Uint32Array of vertex-index pairs [a,b, a,b, …].
 */
/** How many of the (randomly-ordered) particles act as neural-net nodes. */
export const BODY_NODE_COUNT = 2600

export function buildBodyEdges(
  body: Float32Array,
  count: number,
  nodeCount = BODY_NODE_COUNT,
  knn = 3,
  radius = 0.34,
): Uint32Array {
  const N = Math.min(nodeCount, count)
  const cell = radius
  const grid = new Map<string, number[]>()
  const key = (x: number, y: number, z: number) =>
    `${Math.floor(x / cell)}_${Math.floor(y / cell)}_${Math.floor(z / cell)}`

  for (let i = 0; i < N; i++) {
    const k = key(body[i * 3], body[i * 3 + 1], body[i * 3 + 2])
    let arr = grid.get(k)
    if (!arr) {
      arr = []
      grid.set(k, arr)
    }
    arr.push(i)
  }

  const edges: number[] = []
  const seen = new Set<number>()
  const r2 = radius * radius
  const cands: Array<[number, number]> = []
  for (let i = 0; i < N; i++) {
    const x = body[i * 3]
    const y = body[i * 3 + 1]
    const z = body[i * 3 + 2]
    const cx = Math.floor(x / cell)
    const cy = Math.floor(y / cell)
    const cz = Math.floor(z / cell)
    cands.length = 0
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++)
        for (let dz = -1; dz <= 1; dz++) {
          const arr = grid.get(`${cx + dx}_${cy + dy}_${cz + dz}`)
          if (!arr) continue
          for (const j of arr) {
            if (j === i) continue
            const ax = body[j * 3] - x
            const ay = body[j * 3 + 1] - y
            const az = body[j * 3 + 2] - z
            const d2 = ax * ax + ay * ay + az * az
            if (d2 <= r2 && d2 > 1e-6) cands.push([j, d2])
          }
        }
    cands.sort((a, b) => a[1] - b[1])
    const lim = Math.min(knn, cands.length)
    for (let k = 0; k < lim; k++) {
      const j = cands[k][0]
      const a = Math.min(i, j)
      const b = Math.max(i, j)
      const id = a * count + b
      if (seen.has(id)) continue
      seen.add(id)
      edges.push(a, b)
    }
  }
  return new Uint32Array(edges)
}

/** Anatomical labels for the skeleton stage (clinical grotesque, HUD leaders). */
export const ANATOMY_LABELS: { text: string; at: V3 }[] = [
  { text: 'CRANIUM', at: J.head },
  { text: 'CLAVICLE', at: J.shoulderR },
  { text: 'STERNUM', at: [0, 1.05, 0.18] },
  { text: 'HUMERUS', at: J.elbowL },
  { text: 'PELVIS', at: [0.14, 0.06, 0] },
  { text: 'FEMUR', at: J.kneeR },
  { text: 'TIBIA', at: J.ankleL },
]
