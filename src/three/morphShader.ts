/**
 * Point-cloud morph shader — ported from nodefield's Nodes shader, extended to
 * THREE stages. Instanced billboard quads; each particle lerps across three
 * position buffers as uMorph runs 0 → 1 → 2:
 *   uMorph 0..1  →  mix(cells,    skeleton, uMorph)
 *   uMorph 1..2  →  mix(skeleton, body,     uMorph - 1)
 *
 * Color comes from the gold LUT (dark→gold→white), sampled per-particle by aT,
 * with a brightness lift as the figure resolves. Additive blend = light. (§13)
 */

export const MORPH_VERT = /* glsl */ `
  attribute vec3 aCells;
  attribute vec3 aSkeleton;
  attribute vec3 aBody;
  attribute float aT;     // per-particle 0..1 (color + size variety)
  attribute float aScale; // relative dot size
  attribute float aNode;  // 1 = neural-net node (survives the body stage)

  uniform float uMorph;   // 0..2
  uniform float uDotSize;
  uniform float uTime;

  varying float vT;
  varying vec2  vUv;
  varying float vViewDepth;
  varying float vForm;    // 0 loose .. 1 fully formed
  varying float vSeg;     // raw 0..2 stage
  varying float vNode;    // 1 = neural-net node

  void main() {
    vUv = position.xy;
    vT = aT;
    vNode = aNode;

    // three-stage interpolation
    float seg = clamp(uMorph, 0.0, 2.0);
    vSeg = seg;
    vec3 pos = seg < 1.0
      ? mix(aCells, aSkeleton, seg)
      : mix(aSkeleton, aBody, seg - 1.0);

    vForm = smoothstep(0.0, 1.6, seg);

    // organic drift ONLY while the cloud is loose — fully settled by the time
    // the skeleton forms (seg→1), so the anatomy reads crisp and still.
    float settle = smoothstep(0.0, 0.9, seg); // 0 cells .. 1 by skeleton
    float drift = (1.0 - settle) * 0.12;
    pos.x += sin(uTime * 0.4 + aT * 30.0) * drift;
    pos.y += cos(uTime * 0.33 + aT * 41.0) * drift;
    pos.z += sin(uTime * 0.29 + aT * 17.0) * drift;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewDepth = -mv.z;
    mv.xy += position.xy * aScale * uDotSize;
    gl_Position = projectionMatrix * mv;
  }
`

export const MORPH_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uLUT;
  uniform float uEmission;
  uniform float uCamDist;
  uniform float uFogR;

  varying float vT;
  varying vec2  vUv;
  varying float vViewDepth;
  varying float vForm;
  varying float vSeg;
  varying float vNode;

  void main() {
    // round dot — sharp edge + tight core for a crisp pinprick, minimal halo
    float d = length(vUv);
    float soft = smoothstep(0.5, 0.28, d); // hard-ish circular edge (was a wide blur)
    float core = smoothstep(0.26, 0.0, d);

    // gold ramp; formed particles ride brighter up the ramp
    float t = clamp(vT * 0.7 + vForm * 0.4, 0.0, 1.0);
    vec3 base = texture2D(uLUT, vec2(t, 0.5)).rgb;

    // atmospheric depth fade toward the void
    float near = uCamDist - uFogR * 1.4;
    float far  = uCamDist + uFogR * 1.8;
    float df = clamp((far - vViewDepth) / max(0.001, far - near), 0.0, 1.0);
    df *= df;

    // as the body forms, the dense fill condenses to the neural-net nodes:
    // non-node particles fade away, node particles stay bright. Earlier stages
    // (cells/skeleton) keep every point.
    float bodyMix = smoothstep(1.3, 1.9, vSeg);
    float nonNode = mix(1.0, 0.06, bodyMix);   // fill dissolves at the body
    float pointFade = mix(nonNode, 1.0, vNode); // nodes survive

    float emis = uEmission * (0.5 + 0.55 * vForm);
    vec3 color = base * emis * (soft * 0.5 + core * 1.0) * df * pointFade;
    float alpha = soft * df * (0.55 + 0.45 * vForm) * pointFade;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

// unit quad (two triangles) used as the instanced billboard
export const QUAD = new Float32Array([
  -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
])
