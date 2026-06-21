/**
 * Echo Field — a calm central ripple that loops forever in the middle (gentle
 * concentric warm rings), plus click-spawned smaller ripples that expand and
 * fade wherever you click. Rings render as thin warm crests on the transparent
 * void (troughs stay clear), so it reads clean — never a busy/blurry field.
 */

export const ECHO_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const ECHO_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2  uRes;
  uniform vec3  uPings[8]; // .xy = normalized click pos, .z = start time (<0 inactive)
  varying vec2  vUv;

  // warm thermal tone — sampled from the reference x-ray body (deep ember →
  // warm orange → hot peach highlight). On-brand with the body morph's emitted gold.
  vec3 warm(float t) {
    vec3 a = vec3(0.796, 0.322, 0.200);  // #cb5233 deep ember (low crest)
    vec3 b = vec3(0.945, 0.631, 0.353);  // #f1a15a warm orange (mid)
    vec3 c = vec3(0.988, 0.922, 0.749);  // #fceabf hot peach highlight
    return t < 0.5 ? mix(a, b, t * 2.0) : mix(b, c, (t - 0.5) * 2.0);
  }

  void main() {
    float ar = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * ar, vUv.y);

    // central main ripple — perpetual gentle outward rings, concentrated in the
    // middle (decays outward so the edges stay calm).
    vec2 c = vec2(0.5 * ar, 0.5);
    float dC = distance(p, c);
    float center = sin(dC * 15.0 - uTime * 1.5) * exp(-dC * 1.7);

    // click ripples — thin expanding rings that fade over ~2s, smaller scale.
    float pings = 0.0;
    for (int i = 0; i < 8; i++) {
      vec3 pg = uPings[i];
      if (pg.z < 0.0) continue;
      float age = uTime - pg.z;
      if (age < 0.0 || age > 2.0) continue;
      float d = distance(p, vec2(pg.x * ar, pg.y));
      float radius = age * 0.42;
      float ring = exp(-pow((d - radius) * 11.0, 2.0));
      pings += ring * (1.0 - age / 2.0);
    }

    // only outgoing crests carry colour → crisp rings, transparent troughs
    float crest = clamp(center * 0.6 + pings * 1.0, 0.0, 1.0);
    vec3 col = warm(0.35 + crest * 0.6);

    float vig = smoothstep(1.05, 0.2, distance(vUv, vec2(0.5)));
    float alpha = pow(crest, 1.3) * 0.45 * vig;
    gl_FragColor = vec4(col, alpha);
  }
`
