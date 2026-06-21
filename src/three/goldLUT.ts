import { Color, DataTexture, LinearFilter, RGBAFormat, SRGBColorSpace } from 'three'

/**
 * The MJ thermal ramp: near-black maroon → blood → blood-orange → hot orange →
 * amber → hot white. A radiological/CT-scan heat map — cold tissue is deep red,
 * hot bone reads white. This is the only color in the build; particles emit it
 * and the figure glows like a body on a thermal scanner. (PRD §6.1, §13)
 */
const STOPS: { t: number; c: string }[] = [
  { t: 0.0, c: '#0a0204' }, // near-black maroon (deep tissue / void)
  { t: 0.22, c: '#3d0a08' }, // dried blood
  { t: 0.42, c: '#8c1d0a' }, // dark red-orange
  { t: 0.6, c: '#d6431a' }, // blood orange
  { t: 0.76, c: '#ff7a1e' }, // hot orange
  { t: 0.9, c: '#ffb454' }, // amber
  { t: 1.0, c: '#fff0d6' }, // white-hot (bone)
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
