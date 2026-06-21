/**
 * Skin-membrane morph shader — the dots are a translucent SKIN/CLOTH shell, not
 * the bones. Instanced billboard quads drape onto the body's outer surface and
 * stay there; the skeleton / body GLB glows HOT beneath, read through the porous
 * membrane like a body on a thermal CT scanner.
 *
 *   uMorph 0..1  →  mix(cells, body-shell, …)   dust gathers into skin
 *   uMorph 1..2  →  the skin settles in place as the anatomy resolves below
 *
 * A travelling scan plane (uScanY) flares the membrane where it passes. A fake
 * fresnel (no per-particle normals — derived from the radial direction) makes the
 * silhouette glow hottest, so the figure reads volumetric. Color = thermal LUT.
 * Soft additive dots so the bones bleed through. (§13)
 */

export const MORPH_VERT = /* glsl */ `
  attribute vec3 aCells;
  attribute vec3 aSkeleton; // kept for buffer compat (bones are the GLB now)
  attribute vec3 aBody;     // the skin shell — the membrane target
  attribute float aT;       // per-particle 0..1 (color + size variety)
  attribute float aScale;   // relative dot size
  attribute float aNode;    // 1 = neural-net node

  uniform float uMorph;   // 0..2
  uniform float uDotSize;
  uniform float uTime;
  uniform float uScanY;   // scan-plane height in figure space (~ -2..2)

  varying float vT;
  varying vec2  vUv;
  varying float vViewDepth;
  varying float vForm;    // 0 loose .. 1 fully formed
  varying float vSeg;     // raw 0..2 stage
  varying float vNode;    // 1 = neural-net node
  varying float vRim;     // 0 facing .. 1 grazing (silhouette)
  varying float vScan;    // 0 .. 1 proximity to the scan plane

  void main() {
    vUv = position.xy;
    vT = aT;
    vNode = aNode;

    // dust gathers onto the SKIN shell and stays — bones live in the GLB below
    float seg = clamp(uMorph, 0.0, 2.0);
    vSeg = seg;
    float gather = smoothstep(0.0, 1.0, seg); // cells .. skin
    vec3 pos = mix(aCells, aBody, gather);

    vForm = smoothstep(0.0, 1.6, seg);

    // radial "normal" — direction from the figure's core. Cheap stand-in for a
    // real surface normal; good enough for fresnel + scan displacement.
    vec3 core = vec3(0.0, 0.0, 0.0);
    vec3 nrm = normalize(pos - core + 1e-4);

    // organic drift while loose; once gathered, a faint cloth "breathing" along
    // the normal so the membrane feels alive but settled.
    float settle = smoothstep(0.0, 0.9, seg);
    float drift = (1.0 - settle) * 0.12;
    pos.x += sin(uTime * 0.4 + aT * 30.0) * drift;
    pos.y += cos(uTime * 0.33 + aT * 41.0) * drift;
    pos.z += sin(uTime * 0.29 + aT * 17.0) * drift;
    pos += nrm * sin(uTime * 0.8 + aT * 24.0) * 0.012 * settle; // breathing

    // travelling scan plane — gaussian band in Y; lifts the skin slightly as the
    // beam passes (the scanned slice "blooms" off the surface)
    float scan = exp(-pow((pos.y - uScanY) / 0.16, 2.0));
    vScan = scan;
    pos += nrm * scan * 0.05;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewDepth = -mv.z;

    // fresnel from the radial normal vs. view direction
    vec3 vnrm = normalize(normalMatrix * nrm);
    vec3 vdir = normalize(-mv.xyz);
    vRim = pow(1.0 - abs(dot(vnrm, vdir)), 1.6);

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
  varying float vRim;
  varying float vScan;

  void main() {
    // soft round membrane dot (alpha falloff) — porous skin, not a hard pixel
    float d = length(vUv);
    float alpha = smoothstep(0.5, 0.04, d);
    if (alpha <= 0.001) discard;

    // thermal color: base heat from per-particle seed + form, pushed HOT toward
    // the silhouette (fresnel) and along the scan beam.
    float heat = clamp(vT * 0.45 + vForm * 0.22 + vRim * 0.5 + vScan * 0.6, 0.0, 1.0);
    vec3 base = texture2D(uLUT, vec2(heat, 0.5)).rgb;

    // emission: rim + scan blow out toward white-hot; nodes glow a touch hotter
    float emis = uEmission * (0.55 + 0.45 * vForm) * (1.0 + vRim * 0.6 + vScan * 1.4);
    emis *= (1.0 + vNode * 0.25);

    // membrane opacity — translucent so the bones beneath bleed through; the
    // grazing rim and the scan slice read more solid (the body's edge / the cut)
    float a = alpha * (0.32 + vRim * 0.4 + vScan * 0.5) * (0.5 + 0.5 * vForm);

    // dissolve the dotted skin as the body resolves — the membrane is the
    // skin-over-skeleton SCAN moment; the final form is the translucent flesh
    // mesh, so the dots hand off to it instead of overlapping as a second figure
    a *= 1.0 - smoothstep(1.45, 1.9, vSeg);
    if (a <= 0.001) discard;

    gl_FragColor = vec4(base * emis, a);
  }
`

// unit quad (two triangles) used as the instanced billboard
export const QUAD = new Float32Array([
  -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
])
