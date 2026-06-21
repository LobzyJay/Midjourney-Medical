/**
 * Bake an OBJ surface into a compact point cloud for the morph centerpiece.
 *
 * Why: shipping + sampling an 8MB GLB in the browser is slow. Instead we sample
 * here, once, and emit a tiny Float32 binary (N×3) that the app fetches and
 * drops straight into the skeleton morph buffer — no GLTFLoader, no runtime
 * MeshSurfaceSampler, no per-frame cost.
 *
 * Output frame matches humanPoints.ts: y up, figure ~4 units tall centered on
 * the origin. Run:  node scripts/bake-skeleton.mjs <input.obj> <count>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const INPUT = process.argv[2] || '/Users/lobzy/Downloads/Male_Skeletal_System_V05/Male_Skeletal_System_V05.obj'
const COUNT = parseInt(process.argv[3] || '24000', 10)
const OUT = 'public/models/skeleton.bin'
const TARGET_HEIGHT = 4

// ---- parse OBJ (positions + triangulated faces) ----
const verts = []
const tris = [] // [i0,i1,i2] zero-based into verts
const text = readFileSync(INPUT, 'utf8')
for (const line of text.split('\n')) {
  if (line[0] === 'v' && line[1] === ' ') {
    const p = line.split(/\s+/)
    verts.push([+p[1], +p[2], +p[3]])
  } else if (line[0] === 'f' && line[1] === ' ') {
    const idx = line
      .trim()
      .split(/\s+/)
      .slice(1)
      .map((tok) => {
        const v = parseInt(tok.split('/')[0], 10)
        return v < 0 ? verts.length + v : v - 1 // handle negative refs
      })
    // fan-triangulate any polygon
    for (let i = 1; i < idx.length - 1; i++) tris.push([idx[0], idx[i], idx[i + 1]])
  }
}
console.log(`parsed ${verts.length} verts, ${tris.length} tris`)

// ---- area-weighted cumulative distribution ----
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]
const len = (a) => Math.hypot(a[0], a[1], a[2])

const cdf = new Float64Array(tris.length)
let total = 0
for (let i = 0; i < tris.length; i++) {
  const [a, b, c] = tris[i]
  const area = 0.5 * len(cross(sub(verts[b], verts[a]), sub(verts[c], verts[a])))
  total += area
  cdf[i] = total
}

function pickTri(r) {
  // binary search the cdf
  let lo = 0,
    hi = cdf.length - 1
  const x = r * total
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cdf[mid] < x) lo = mid + 1
    else hi = mid
  }
  return lo
}

// ---- sample points (barycentric, uniform on triangle) ----
const pts = new Float32Array(COUNT * 3)
for (let i = 0; i < COUNT; i++) {
  const t = tris[pickTri(Math.random())]
  let u = Math.random()
  let v = Math.random()
  if (u + v > 1) {
    u = 1 - u
    v = 1 - v
  }
  const [a, b, c] = [verts[t[0]], verts[t[1]], verts[t[2]]]
  pts[i * 3] = a[0] + u * (b[0] - a[0]) + v * (c[0] - a[0])
  pts[i * 3 + 1] = a[1] + u * (b[1] - a[1]) + v * (c[1] - a[1])
  pts[i * 3 + 2] = a[2] + u * (b[2] - a[2]) + v * (c[2] - a[2])
}

// ---- bbox → auto-upright (tallest axis = Y) → center → scale ----
const min = [Infinity, Infinity, Infinity]
const max = [-Infinity, -Infinity, -Infinity]
for (let i = 0; i < COUNT; i++) {
  for (let k = 0; k < 3; k++) {
    const val = pts[i * 3 + k]
    if (val < min[k]) min[k] = val
    if (val > max[k]) max[k] = val
  }
}
const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
const tallest = size.indexOf(Math.max(...size)) // human height = largest extent
const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
const scale = TARGET_HEIGHT / size[tallest]
console.log(`bbox size ${size.map((s) => s.toFixed(2))}, tallest axis ${tallest}`)

for (let i = 0; i < COUNT; i++) {
  let x = (pts[i * 3] - center[0]) * scale
  let y = (pts[i * 3 + 1] - center[1]) * scale
  let z = (pts[i * 3 + 2] - center[2]) * scale
  // rotate so the tallest axis becomes Y (model may be Z-up)
  if (tallest === 2) [y, z] = [z, -y]
  else if (tallest === 0) [x, y] = [y, -x]
  pts[i * 3] = x
  pts[i * 3 + 1] = y
  pts[i * 3 + 2] = z
}

mkdirSync('public/models', { recursive: true })
writeFileSync(OUT, Buffer.from(pts.buffer))
console.log(`wrote ${OUT} — ${COUNT} pts, ${(pts.byteLength / 1024).toFixed(0)} KB`)
