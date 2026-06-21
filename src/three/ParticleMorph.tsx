import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  ShaderMaterial,
  Sphere,
  Vector3,
} from 'three'
import { buildMorphStages, buildBodyEdges, BODY_NODE_COUNT } from './humanPoints'
import { buildGoldLUT } from './goldLUT'
import { MORPH_VERT, MORPH_FRAG, QUAD } from './morphShader'
import { LINE_VERT, LINE_FRAG } from './morphLineShader'
import { Effects } from './Effects'

// Prebaked accurate point clouds (scripts/bake-skeleton.mjs). Tiny Float32
// binaries — fetched once, no GLTFLoader/sampler at runtime. Absent file →
// the procedural figure stays. Points are pre-shuffled, so the first N are a
// representative subset for lower mobile counts.
const SKELETON_BIN = '/models/skeleton.bin'
const BODY_BIN = '/models/body.bin'

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
      uLineOpacity: { value: 0.5 },
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
      uDotSize: { value: 0.052 },
      uEmission: { value: 1.2 },
      uTime: { value: 0 },
      uCamDist: { value: 6 },
      uFogR: { value: 2.6 },
    }),
    [lut],
  )

  useFrame((state, delta) => {
    const m = matRef.current
    if (!m) return
    // critically-damped follow of scroll → uMorph (calm, weighted)
    const target = progress.current * 2
    groupMorph.current += (target - groupMorph.current) * Math.min(1, delta * 4)
    const u = m.uniforms
    u.uMorph.value = groupMorph.current
    u.uTime.value = state.clock.elapsedTime
    u.uCamDist.value = state.camera.position.length()

    const lm = lineMatRef.current
    if (lm) {
      lm.uniforms.uMorph.value = groupMorph.current
      lm.uniforms.uTime.value = state.clock.elapsedTime
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
      <mesh geometry={geometry} frustumCulled={false}>
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

// slow living rotation of the whole figure
function LivingRig({ children }: { children: ReactNode }) {
  const ref = useRef<import('three').Group>(null)
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.22
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
  return (
    <Canvas
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, dprMax]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0.1, 6], fov: 45 }}
      style={{ background: 'transparent' }}
    >
      <LivingRig>
        <MorphPoints progress={progress} count={count} />
      </LivingRig>
      <Effects />
    </Canvas>
  )
}
