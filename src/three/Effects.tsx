import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

/**
 * Postprocessing — "the glow is the brand." Bloom + ACES + grain + vignette.
 * Ported from nodefield's Effects, tuned warm and restrained for the void. (§13)
 */
export function Effects({ strength = 1 }: { strength?: number }) {
  return (
    <EffectComposer multisampling={8}>
      <Bloom
        mipmapBlur
        intensity={0.16 * strength}
        luminanceThreshold={0.72}
        luminanceSmoothing={0.15}
        radius={0.22}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.1} premultiply />
      <Vignette eskil={false} offset={0.3} darkness={0.92} />
    </EffectComposer>
  )
}
