import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  MeshStandardMaterial,
  NormalBlending,
  ShaderMaterial,
  Sphere,
  Vector3,
  type Object3D,
} from 'three'
import { buildMorphStages, buildBodyEdges, BODY_NODE_COUNT } from './humanPoints'
import { buildGoldLUT } from './goldLUT'
import { MORPH_VERT, MORPH_FRAG, QUAD } from './morphShader'
import { MOTE_VERT, MOTE_FRAG } from './energyShader'
import { LINE_VERT, LINE_FRAG } from './morphLineShader'
import { Effects } from './Effects'
import { CAM, cameraZ } from './figureFit'
import { asset } from '../lib/asset'

/**
 * Pulls the camera back on narrow/portrait viewports so the full T-pose width
 * fits (shared with BodyMorph's label projection via figureFit). Updates on
 * resize; no per-frame cost.
 */
function ResponsiveCamera() {
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  useEffect(() => {
    camera.position.z = cameraZ(width / height)
    camera.updateProjectionMatrix()
  }, [camera, width, height])
  return null
}

// Prebaked accurate point clouds (scripts/bake-skeleton.mjs). Tiny Float32
// binaries — fetched once, no GLTFLoader/sampler at runtime. Absent file →
// the procedural figure stays. Points are pre-shuffled, so the first N are a
// representative subset for lower mobile counts.
const SKELETON_BIN = asset('/models/skeleton.bin')
const BODY_BIN = asset('/models/body.bin')

async function fetchPoints(url: string): Promise<Float32Array | null> {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return new Float32Array(await r.arrayBuffer())
  } catch {
    return null
  }
}

export interface MorphHandle {
  /** scroll progress 0..1 driving the morph (set by the pinned section) */
  current: number
}

// ---- the point cloud (lives inside <Canvas>) ----
function MorphPoints({
  progress,
  count,
}: {
  progress: MorphHandle
  count: number
}) {
  const matRef = useRef<ShaderMaterial>(null)
  const lineMatRef = useRef<ShaderMaterial>(null)
  const groupMorph = useRef(0)

  const stages = useMemo(() => buildMorphStages(count), [count])
  const lut = useMemo(() => buildGoldLUT(), [])

  const geometry = useMemo(() => {
    const geo = new InstancedBufferGeometry()
    geo.setAttribute('position', new BufferAttribute(QUAD, 3))
    geo.setAttribute('aCells', new InstancedBufferAttribute(stages.cells, 3))
    geo.setAttribute('aSkeleton', new InstancedBufferAttribute(stages.skeleton, 3))
    geo.setAttribute('aBody', new InstancedBufferAttribute(stages.body, 3))
    geo.setAttribute('aT', new InstancedBufferAttribute(stages.seed, 1))
    // size variety derived from the seed (stable, no extra buffer needed)
    const scale = new Float32Array(count)
    const node = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      scale[i] = 0.6 + stages.seed[i] * 0.9
      node[i] = i < BODY_NODE_COUNT ? 1 : 0 // neural-net nodes survive at body stage
    }
    geo.setAttribute('aScale', new InstancedBufferAttribute(scale, 1))
    geo.setAttribute('aNode', new InstancedBufferAttribute(node, 1))
    geo.instanceCount = count
    geo.boundingSphere = new Sphere(new Vector3(0, 0, 0), 6)
    return geo
  }, [stages, count])

  // neural-network web — edges between nearby body nodes, gathered into a
  // LineSegments geometry that morphs with the points (body = built-in position)
  const lineGeometry = useMemo(() => {
    const edges = buildBodyEdges(stages.body, count)
    const n = edges.length
    const pos = new Float32Array(n * 3)
    const cel = new Float32Array(n * 3)
    const ske = new Float32Array(n * 3)
    const t = new Float32Array(n)
    for (let k = 0; k < n; k++) {
      const idx = edges[k]
      pos[k * 3] = stages.body[idx * 3]
      pos[k * 3 + 1] = stages.body[idx * 3 + 1]
      pos[k * 3 + 2] = stages.body[idx * 3 + 2]
      cel[k * 3] = stages.cells[idx * 3]
      cel[k * 3 + 1] = stages.cells[idx * 3 + 1]
      cel[k * 3 + 2] = stages.cells[idx * 3 + 2]
      ske[k * 3] = stages.skeleton[idx * 3]
      ske[k * 3 + 1] = stages.skeleton[idx * 3 + 1]
      ske[k * 3 + 2] = stages.skeleton[idx * 3 + 2]
      t[k] = stages.seed[idx]
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3)) // body target
    g.setAttribute('aCells', new BufferAttribute(cel, 3))
    g.setAttribute('aSkeleton', new BufferAttribute(ske, 3))
    g.setAttribute('aT', new BufferAttribute(t, 1))
    return g
  }, [stages, count])

  const lineUniforms = useMemo(
    () => ({
      uLUT: { value: lut },
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uLineOpacity: { value: 0.08 }, // faint connective trace inside the skin
    }),
    [lut],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry])
  useEffect(() => () => lut.dispose(), [lut])

  // progressive upgrade: if a baked point cloud exists, swap it into the
  // skeleton/body target buffer in place. Absent file → procedural stays.
  useEffect(() => {
    let alive = true
    const swap = async (url: string, attr: 'aSkeleton' | 'aBody') => {
      const data = await fetchPoints(url)
      if (!alive || !data || data.length < count * 3) return
      const a = geometry.getAttribute(attr) as InstancedBufferAttribute
      ;(a.array as Float32Array).set(data.subarray(0, count * 3))
      a.needsUpdate = true
    }
    void swap(SKELETON_BIN, 'aSkeleton')
    void swap(BODY_BIN, 'aBody')
    return () => {
      alive = false
    }
  }, [geometry, count])

  const uniforms = useMemo(
    () => ({
      uLUT: { value: lut },
      uMorph: { value: 0 },
      uDotSize: { value: 0.026 }, // larger soft dots → membrane, not confetti
      uEmission: { value: 1.15 },
      uTime: { value: 0 },
      uCamDist: { value: 6 },
      uFogR: { value: 2.6 },
      uScanY: { value: 2.2 }, // scan plane height (figure space ~ -2.2..2.2)
    }),
    [lut],
  )

  useFrame((state, delta) => {
    const m = matRef.current
    if (!m) return
    // critically-damped follow of scroll → uMorph (calm, weighted)
    const target = progress.current * 2
    groupMorph.current += (target - groupMorph.current) * Math.min(1, delta * 4)
    const t = state.clock.elapsedTime
    // travelling scan plane — repeating top→bottom sweep, like a scanner slice
    const sweep = (t * 0.16) % 1
    const scanY = 2.2 - sweep * 4.4
    const u = m.uniforms
    u.uMorph.value = groupMorph.current
    u.uTime.value = t
    u.uCamDist.value = state.camera.position.length()
    u.uScanY.value = scanY

    const lm = lineMatRef.current
    if (lm) {
      lm.uniforms.uMorph.value = groupMorph.current
      lm.uniforms.uTime.value = t
    }
  })

  return (
    <>
      <lineSegments geometry={lineGeometry} frustumCulled={false}>
        <shaderMaterial
          ref={lineMatRef}
          vertexShader={LINE_VERT}
          fragmentShader={LINE_FRAG}
          uniforms={lineUniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
        />
      </lineSegments>
      <mesh geometry={geometry} frustumCulled={false} renderOrder={2}>
        <shaderMaterial
          ref={matRef}
          vertexShader={MORPH_VERT}
          fragmentShader={MORPH_FRAG}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </>
  )
}

// The REAL anatomy stages — rendered as lit meshes (the user's models), not
// points. Each fades in around its morph stage (skeleton = seg 1, body = seg 2)
// so the dust resolves into actual bone / muscle and dissolves again.
const SKELETON_MESH = asset('/models/skeleton_mesh.glb')
const BODY_MESH = asset('/models/body_mesh.glb')
const TARGET_H = 4

function AnatomyMesh({
  url,
  progress,
  color = '#ff9a4a',
  emissive = '#ff7a1e',
  fadeStart,
  fadeFull,
  fadeOutStart,
  fadeOutFull,
  maxOpacity = 0.9,
  emissiveIntensity = 1.1,
  revealStart,
  revealEnd,
  force = false,
}: {
  url: string
  progress: MorphHandle
  color?: string
  emissive?: string
  /** morph seg where this anatomy begins to glow */
  fadeStart: number
  /** morph seg where it reaches full glow */
  fadeFull: number
  /** optional: seg where it begins to recede (bone dissolves as flesh forms) */
  fadeOutStart?: number
  /** optional: seg where it is fully gone */
  fadeOutFull?: number
  maxOpacity?: number
  emissiveIntensity?: number
  /** growth-reveal window (defaults to fade window) — feet→head across this span */
  revealStart?: number
  revealEnd?: number
  /** preview override — pin fully visible regardless of scroll */
  force?: boolean
}) {
  const { scene } = useGLTF(url)
  const eased = useRef(0)
  const revealU = useRef<{ uReveal: { value: number }; uScanY: { value: number } } | null>(null)

  const prepared = useMemo(() => {
    const inner = scene.clone(true)
    // The ORIGINAL solid emissive look — a warm glowing thermal body, lit by the
    // scene rig + self-illuminated. Additive on black, no depth write. The
    // head→feet GROWTH reveal is injected via onBeforeCompile so parts come to
    // life as you scroll without changing this material's look.
    const mat = new MeshStandardMaterial({
      color,
      metalness: 0.1,
      roughness: 0.6,
      emissive,
      emissiveIntensity,
      side: DoubleSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false, // additive shell — no self depth-test → no blinking
      blending: AdditiveBlending,
    })
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uReveal = { value: 0 }
      shader.uniforms.uScanY = { value: 2.2 }
      shader.vertexShader =
        'varying float vWorldY;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n  vWorldY = (modelMatrix * vec4(transformed, 1.0)).y;',
        )
      shader.fragmentShader =
        'varying float vWorldY;\nuniform float uReveal;\nuniform float uScanY;\n' +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           float yN = clamp((vWorldY + 2.0) / 4.0, 0.0, 1.0);
           float edge = 1.1 - uReveal * 1.2;               // head -> feet
           float born = smoothstep(edge - 0.06, edge + 0.06, yN);
           float frnt = exp(-pow((yN - edge) / 0.035, 2.0));
           float scan = born * exp(-pow((vWorldY - uScanY) / 0.1, 2.0));
           if (born <= 0.001 && frnt <= 0.001) discard;
           // scan front tinted to the brand gold (not pure white)
           gl_FragColor.rgb += (frnt * 0.72 + scan * 0.25) * vec3(1.0, 0.74, 0.4);
           gl_FragColor.a *= clamp(born * 0.8 + frnt, 0.0, 1.0);
          `,
        )
      revealU.current = shader.uniforms as unknown as typeof revealU.current
    }
    inner.traverse((o: Object3D) => {
      const m = o as unknown as { isMesh?: boolean; geometry?: { computeVertexNormals?: () => void } }
      if (m.isMesh) {
        ;(o as unknown as { material: unknown }).material = mat
        m.geometry?.computeVertexNormals?.() // fix winding/normals lost in decimation
      }
    })
    // normalize to the shared morph frame: center, scale tallest axis → height,
    // and upright the model if it was authored Z-up or X-up.
    const box = new Box3().setFromObject(inner)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    inner.position.set(-center.x, -center.y, -center.z)
    const g = new Group()
    g.add(inner)
    const longest = Math.max(size.x, size.y, size.z)
    g.scale.setScalar(TARGET_H / (longest || 1))
    if (size.z > size.y && size.z > size.x) g.rotation.x = -Math.PI / 2
    else if (size.x > size.y && size.x > size.z) g.rotation.z = Math.PI / 2
    return { g, mat }
  }, [scene, color, emissive, emissiveIntensity])

  useFrame((state, dt) => {
    const u = revealU.current
    const sweep = (state.clock.elapsedTime * 0.16) % 1
    if (u) u.uScanY.value = 2.2 - sweep * 4.4
    if (force) {
      // preview mode — pin fully visible & fully grown, ignore the scroll morph
      prepared.mat.opacity = maxOpacity
      if (u) u.uReveal.value = 1
      prepared.g.visible = true
      return
    }
    eased.current += (progress.current * 2 - eased.current) * Math.min(1, dt * 4)
    const e = eased.current
    const smooth = (a: number, b: number) => {
      const t = Math.min(1, Math.max(0, (e - a) / Math.max(1e-3, b - a)))
      return t * t * (3 - 2 * t)
    }
    // master fade (one system hands off to the next)
    let o = smooth(fadeStart, fadeFull) * maxOpacity
    if (fadeOutFull !== undefined) o *= 1 - smooth(fadeOutStart ?? fadeFull, fadeOutFull)
    prepared.mat.opacity = o
    // GROWTH reveal — head → feet across the reveal window (decoupled from fade)
    const rs = revealStart ?? fadeStart
    const re = revealEnd ?? fadeFull
    if (u) u.uReveal.value = Math.min(1, Math.max(0, (e - rs) / Math.max(1e-3, re - rs)))
    prepared.g.visible = o > 0.01
  })

  return <primitive object={prepared.g} />
}
useGLTF.preload(SKELETON_MESH)
useGLTF.preload(BODY_MESH)

// Tiny interactive energy motes that appear once the body has fully loaded —
// their anchors are sampled from the BODY MESH SURFACE (mapped into the same
// normalized frame as the figure), so they wrap him like cloth and trace his
// silhouette. Repelled by the cursor, each a small thermal nucleus. Low glow.
function EnergyMotes({ progress, count = 460 }: { progress: MorphHandle; count?: number }) {
  const matRef = useRef<ShaderMaterial>(null)
  const lut = useMemo(() => buildGoldLUT(), [])
  const { scene } = useGLTF(BODY_MESH)

  const geometry = useMemo(() => {
    const geo = new InstancedBufferGeometry()
    geo.setAttribute('position', new BufferAttribute(QUAD, 3))
    const anchors = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const scales = new Float32Array(count)
    let s = 0x9e3779b9
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 4294967296
    }

    // Project every surface vert to the XY plane (normalized frame), rasterize the
    // silhouette into an occupancy grid, then take its BOUNDARY cells (occupied
    // next to empty). That captures the FULL outline incl. concavities — armpits,
    // inner thighs, between the legs — and we push each mote outward into the
    // adjacent empty gap, so they always sit just OUTSIDE the body.
    scene.updateMatrixWorld(true)
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const center = box.getCenter(new Vector3())
    const sc = TARGET_H / (Math.max(size.x, size.y, size.z) || 1)

    const pts: number[] = []
    const tmp = new Vector3()
    scene.traverse((o) => {
      const mm = o as unknown as {
        isMesh?: boolean
        geometry?: import('three').BufferGeometry
        matrixWorld: import('three').Matrix4
      }
      const geom = mm.geometry
      if (!mm.isMesh || !geom?.attributes?.position) return
      const pos = geom.attributes.position
      const step = Math.max(1, Math.floor(pos.count / 60000))
      for (let i = 0; i < pos.count; i += step) {
        tmp.fromBufferAttribute(pos, i).applyMatrix4(mm.matrixWorld)
        pts.push((tmp.x - center.x) * sc, (tmp.y - center.y) * sc)
      }
    })

    let minx = Infinity
    let miny = Infinity
    let maxx = -Infinity
    let maxy = -Infinity
    for (let i = 0; i < pts.length; i += 2) {
      if (pts[i] < minx) minx = pts[i]
      if (pts[i] > maxx) maxx = pts[i]
      if (pts[i + 1] < miny) miny = pts[i + 1]
      if (pts[i + 1] > maxy) maxy = pts[i + 1]
    }
    const cell = 0.05
    minx -= cell
    miny -= cell
    maxx += cell
    maxy += cell
    const gw = Math.max(1, Math.ceil((maxx - minx) / cell) + 1)
    const gh = Math.max(1, Math.ceil((maxy - miny) / cell) + 1)
    const occ = new Uint8Array(gw * gh)
    for (let i = 0; i < pts.length; i += 2) {
      const cx = Math.floor((pts[i] - minx) / cell)
      const cy = Math.floor((pts[i + 1] - miny) / cell)
      if (cx >= 0 && cx < gw && cy >= 0 && cy < gh) occ[cy * gw + cx] = 1
    }
    const bnd: number[] = [] // x, y, dirx, diry (dir points into the empty gap)
    for (let cy = 0; cy < gh; cy++) {
      for (let cx = 0; cx < gw; cx++) {
        if (!occ[cy * gw + cx]) continue
        let dx = 0
        let dy = 0
        let edge = false
        if (!(cx > 0 && occ[cy * gw + cx - 1])) {
          dx -= 1
          edge = true
        }
        if (!(cx < gw - 1 && occ[cy * gw + cx + 1])) {
          dx += 1
          edge = true
        }
        if (!(cy > 0 && occ[(cy - 1) * gw + cx])) {
          dy -= 1
          edge = true
        }
        if (!(cy < gh - 1 && occ[(cy + 1) * gw + cx])) {
          dy += 1
          edge = true
        }
        if (!edge) continue
        const dl = Math.hypot(dx, dy) || 1
        bnd.push(minx + (cx + 0.5) * cell, miny + (cy + 0.5) * cell, dx / dl, dy / dl)
      }
    }
    const nB = bnd.length / 4

    for (let i = 0; i < count; i++) {
      const j = nB > 0 ? Math.floor(rnd() * nB) : 0
      const bx = bnd[j * 4] || 0
      const by = bnd[j * 4 + 1] || 0
      const dx = bnd[j * 4 + 2] || 0
      const dy = bnd[j * 4 + 3] || 0
      const out = 0.02 + rnd() * 0.07
      anchors[i * 3] = bx + dx * out + (rnd() - 0.5) * 0.04
      anchors[i * 3 + 1] = by + dy * out + (rnd() - 0.5) * 0.04
      anchors[i * 3 + 2] = 0
      seeds[i] = rnd()
      scales[i] = 0.5 + rnd() * 0.9
    }
    geo.setAttribute('aAnchor', new InstancedBufferAttribute(anchors, 3))
    geo.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1))
    geo.setAttribute('aScale', new InstancedBufferAttribute(scales, 1))
    geo.instanceCount = count
    geo.boundingSphere = new Sphere(new Vector3(0, 0, 0), 4)
    return geo
  }, [scene, count])

  const uniforms = useMemo(
    () => ({
      uLUT: { value: lut },
      uTime: { value: 0 },
      uSize: { value: 0.03 }, // tiny
      uPointer: { value: new Vector3() },
      uOpacity: { value: 0 },
    }),
    [lut],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => lut.dispose(), [lut])

  useFrame((state) => {
    const m = matRef.current
    if (!m) return
    const u = m.uniforms
    u.uTime.value = state.clock.elapsedTime
    // emerge only after the figure has fully arrived (during the hold)
    const target = Math.min(1, Math.max(0, (progress.current - 0.76) / 0.12))
    u.uOpacity.value += (target - u.uOpacity.value) * 0.08
    // pointer → world XY on the z≈0 plane (figure plane)
    const vp = state.viewport
    u.uPointer.value.set((state.pointer.x * vp.width) / 2, (state.pointer.y * vp.height) / 2, 0)
  })

  return (
    <mesh geometry={geometry} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        ref={matRef}
        vertexShader={MOTE_VERT}
        fragmentShader={MOTE_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={NormalBlending}
      />
    </mesh>
  )
}

// ARRIVAL turn — the body HOLDS turned ~30° to the right while it assembles
// (head→feet reveal), then once formed it rotates to front (0°) over
// TURN_START→TURN_END, settling exactly at yaw 0. It then holds front-facing,
// which is when the anatomy labels appear (front-facing projection is exact at
// yaw 0, so no per-frame landmark rotation is needed).
const START_YAW = -0.52 // rad (~30°); negative reads as turned to the RIGHT
const TURN_START = 0.42 // m: body is ~assembled — begin rotating to front
const TURN_END = 0.72 // m: fully front-facing; labels appear after this
function LivingRig({ children, progress }: { children: ReactNode; progress: MorphHandle }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    if (!ref.current) return
    const t = Math.min(1, Math.max(0, (progress.current - TURN_START) / (TURN_END - TURN_START)))
    const ease = t * t * (3 - 2 * t) // smoothstep 0→1
    ref.current.rotation.y = START_YAW * (1 - ease)
  })
  return <group ref={ref}>{children}</group>
}

/**
 * ParticleMorph — self-contained WebGL canvas for the centerpiece.
 * Heavy/perpetual animation isolated here; the section just feeds `progress`.
 */
export function ParticleMorph({
  progress,
  count = 24000,
  dprMax = 2,
  active = true,
}: {
  progress: MorphHandle
  count?: number
  dprMax?: number
  /** when false the render loop is parked (offscreen) — saves GPU/battery */
  active?: boolean
}) {
  // preview routing — ?view=skeleton | body | dots. Default: clean scroll morph
  // (skeleton → translucent body), no particle visualization.
  const view = useMemo(
    () =>
      typeof window === 'undefined'
        ? null
        : new URLSearchParams(window.location.search).get('view'),
    [],
  )
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, dprMax]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, CAM.y, CAM.z], fov: CAM.fov }}
      style={{ background: 'transparent' }}
    >
      <ResponsiveCamera />
      <ambientLight intensity={0.4} color="#2a0d06" />
      <directionalLight position={[3, 5, 4]} intensity={1.4} color="#ff8a3c" />
      <directionalLight position={[-4, 1, -2]} intensity={0.6} color="#d6431a" />
      <pointLight position={[0, 0.5, 3]} intensity={4} distance={12} color="#ffb454" />
      <LivingRig progress={progress}>
        {/* debug: ?view=dots brings back the legacy particle visualization */}
        {view === 'dots' && <MorphPoints progress={progress} count={count} />}
        <Suspense fallback={null}>
          {/* SKELETON — preview only for now (?view=skeleton). */}
          {view === 'skeleton' && (
            <AnatomyMesh
              url={SKELETON_MESH}
              progress={progress}
              color="#ffcaa0"
              emissive="#ff7a2a"
              fadeStart={0.2}
              fadeFull={0.7}
              maxOpacity={0.85}
              emissiveIntensity={1.0}
              force
            />
          )}
          {/* TRANSLUCENT BODY — the figure. Present from the start; a growth
              front travels feet→head across the whole scroll so parts come to
              life as you scroll. ?view=body pins it fully grown. */}
          {view !== 'skeleton' && (
            <AnatomyMesh
              url={BODY_MESH}
              progress={progress}
              color="#9c2a12"
              emissive="#ff5a1e"
              fadeStart={0.0}
              fadeFull={0.25}
              maxOpacity={0.55}
              emissiveIntensity={0.6}
              revealStart={0.2}
              revealEnd={0.85}
              force={view === 'body'}
            />
          )}
        </Suspense>
        {/* energy motes — emerge once the body has fully loaded */}
        {view !== 'skeleton' && <EnergyMotes progress={progress} />}
      </LivingRig>
      <Effects />
    </Canvas>
  )
}
