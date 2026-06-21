import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ShaderMaterial, Vector2, Vector3 } from 'three'
import { ECHO_VERT, ECHO_FRAG } from './echoShader'

function EchoPlane() {
  const mat = useRef<ShaderMaterial>(null)
  const { size } = useThree()
  const time = useRef(0)
  const slot = useRef(0)

  // 8 reusable click-ripple slots (.z = start time, <0 = inactive)
  const pings = useMemo(() => Array.from({ length: 8 }, () => new Vector3(0, 0, -1)), [])
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new Vector2(1, 1) },
      uPings: { value: pings },
    }),
    [pings],
  )

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth
      const ny = 1 - e.clientY / window.innerHeight
      pings[slot.current].set(nx, ny, time.current)
      slot.current = (slot.current + 1) % pings.length
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [pings])

  useFrame((st) => {
    const m = mat.current
    if (!m) return
    time.current = st.clock.elapsedTime
    m.uniforms.uTime.value = st.clock.elapsedTime
    ;(m.uniforms.uRes.value as Vector2).set(size.width, size.height)
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        vertexShader={ECHO_VERT}
        fragmentShader={ECHO_FRAG}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

/** Hero echo field — central looping ripple + click-spawned ripples. */
export function EchoField({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      frameloop={active ? 'always' : 'never'}
      style={{ background: 'transparent', pointerEvents: 'none' }}
      orthographic
      camera={{ position: [0, 0, 1] }}
    >
      <EchoPlane />
    </Canvas>
  )
}
