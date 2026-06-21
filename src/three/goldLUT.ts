import { Color, DataTexture, LinearFilter, RGBAFormat, SRGBColorSpace } from 'three'

/**
 * The MJ light ramp: dark ember → gold → warm white. Single hue.
 * This is the only color in the build — particles emit it. (PRD §6.1, §13)
 * Replaces nodefield's cool spectrum LUT.
 */
const STOPS: { t: number; c: string }[] = [
  { t: 0.0, c: '#140a02' }, // near-black warm
  { t: 0.32, c: '#5e2f08' }, // deep amber
  { t: 0.55, c: '#b87020' }, // burnt gold
  { t: 0.74, c: '#f0a23c' }, // gold
  { t: 0.9, c: '#ffd27a' }, // hot gold
  { t: 1.0, c: '#fff4e2' }, // warm white
]

const _a = new Color()
const _b = new Color()

export function buildGoldLUT(width = 256): DataTexture {
  const data = new Uint8Array(width * 4)
  const c = new Color()
  for (let x = 0; x < width; x++) {
    const t = x / (width - 1)
    // find bracketing stops
    let i = 0
    while (i < STOPS.length - 1 && t > STOPS[i + 1].t) i++
    const s0 = STOPS[i]
    const s1 = STOPS[Math.min(STOPS.length - 1, i + 1)]
    const span = Math.max(1e-5, s1.t - s0.t)
    const f = Math.min(1, Math.max(0, (t - s0.t) / span))
    _a.set(s0.c)
    _b.set(s1.c)
    c.copy(_a).lerp(_b, f)
    data[x * 4] = Math.round(Math.min(1, c.r) * 255)
    data[x * 4 + 1] = Math.round(Math.min(1, c.g) * 255)
    data[x * 4 + 2] = Math.round(Math.min(1, c.b) * 255)
    data[x * 4 + 3] = 255
  }
  const tex = new DataTexture(data, width, 1, RGBAFormat)
  tex.colorSpace = SRGBColorSpace
  tex.minFilter = LinearFilter
  tex.magFilter = LinearFilter
  tex.needsUpdate = true
  return tex
}
