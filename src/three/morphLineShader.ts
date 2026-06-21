/**
 * Connection-line shader for the neural-network final form. Each line vertex
 * carries the same 3-stage positions as the points (cells/skeleton/body) and
 * morphs identically, so the web assembles with the figure — but its opacity
 * only ramps up as the body forms (uMorph → 2), so earlier stages stay clean
 * points. The body target is the built-in `position` attribute. (§13)
 */

export const LINE_VERT = /* glsl */ `
  attribute vec3 aCells;
  attribute vec3 aSkeleton;
  attribute float aT;

  uniform float uMorph;  // 0..2
  uniform float uTime;

  varying float vT;
  varying float vAlpha;

  void main() {
    vT = aT;
    float seg = clamp(uMorph, 0.0, 2.0);
    // cells → skeleton → body(=position), matching the points exactly
    vec3 pos = seg < 1.0
      ? mix(aCells, aSkeleton, seg)
      : mix(aSkeleton, position, seg - 1.0);

    // same settle-drift as the points so endpoints sit on their dots
    float settle = smoothstep(0.0, 0.9, seg);
    float drift = (1.0 - settle) * 0.12;
    pos.x += sin(uTime * 0.4 + aT * 30.0) * drift;
    pos.y += cos(uTime * 0.33 + aT * 41.0) * drift;
    pos.z += sin(uTime * 0.29 + aT * 17.0) * drift;

    // the web only belongs to the final form
    vAlpha = smoothstep(1.2, 1.85, seg);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

export const LINE_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uLUT;
  uniform float uLineOpacity;

  varying float vT;
  varying float vAlpha;

  void main() {
    if (vAlpha < 0.004) discard;
    vec3 base = texture2D(uLUT, vec2(clamp(vT * 0.7 + 0.32, 0.0, 1.0), 0.5)).rgb;
    gl_FragColor = vec4(base * 1.15, vAlpha * uLineOpacity);
  }
`
