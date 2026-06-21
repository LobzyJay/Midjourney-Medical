import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'

/**
 * Postprocessing — thermal SCANNER grade. The figure glows like a body on a CT
 * monitor: a soft volumetric bloom on the hot bone / silhouette rim / scan
 * slice, a dark vignette for the monitor frame, ACES color, and a whisper of
 * grain. (strength kept for API compatibility.)
 */
export function Effects(_props: { strength?: number }) {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.16}
        luminanceThreshold={0.68}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.5}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette eskil={false} offset={0.28} darkness={0.62} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.04} premultiply />
    </EffectComposer>
  )
}
