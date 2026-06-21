/**
 * Energy motes — tiny instanced billboard "balls" that drift around the figure
 * once it has fully loaded. Each has a bright NUCLEUS + a soft halo (echoing the
 * body's own core-glow), thermal-gold colored, gently orbiting its anchor and
 * repelled by the pointer (interactive). Kept small, bounded near the body, and
 * low-glow so the frame stays clean — not rough.
 */

export const MOTE_VERT = /* glsl */ `
  attribute vec3 aAnchor;
  attribute float aSeed;
  attribute float aScale;

  uniform float uTime;
  uniform float uSize;
  uniform vec3 uPointer; // world-space pointer (z≈0 plane)

  varying vec2 vUv;
  varying float vSeed;
  varying float vPulse;

  void main() {
    vUv = position.xy;
    vSeed = aSeed;

    vec3 pos = aAnchor;
    // tiny shimmer around the anchor — cloth clinging to the silhouette, not a
    // loose orbit, so the motes keep tracing the body's outline
    float t = uTime * 0.5 + aSeed * 6.2831853;
    pos.x += sin(t) * 0.022;
    pos.y += cos(t * 0.8) * 0.022;
    pos.z += sin(t * 0.6) * 0.02;

    // pointer repulsion in XY — small, tight forcefield around the cursor
    vec2 d = pos.xy - uPointer.xy;
    float dist = length(d);
    pos.xy += normalize(d + 1e-4) * smoothstep(0.45, 0.0, dist) * 0.16;

    // slow energy pulse for the nucleus brightness
    vPulse = 0.7 + 0.3 * sin(uTime * 1.6 + aSeed * 20.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    mv.xy += position.xy * aScale * uSize;
    gl_Position = projectionMatrix * mv;
  }
`

export const MOTE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uLUT;
  uniform float uOpacity;

  varying vec2 vUv;
  varying float vSeed;
  varying float vPulse;

  void main() {
    float d = length(vUv);
    if (d > 0.5) discard;
    // soft solid dot — a "skin cell", low glow (normal-blended, not additive)
    float dot = smoothstep(0.5, 0.08, d);
    float a = dot * uOpacity * (0.55 + 0.45 * vPulse);
    if (a <= 0.001) discard;

    // warm orange → light brown (not pure red); slight per-mote variety
    vec3 col = texture2D(uLUT, vec2(0.74 + vSeed * 0.18, 0.5)).rgb;
    col = mix(col, vec3(0.82, 0.6, 0.42), 0.3); // toward warm light brown
    gl_FragColor = vec4(col, a);
  }
`
