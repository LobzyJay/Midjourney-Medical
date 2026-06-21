/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Swiss / International Typographic Style — strict, rational scale.
    extend: {
      colors: {
        void: '#06070A', // global background; near-black blue so glows read
        cream: '#E7E3D4', // primary text / hottest UI light
        'cream-dim': 'rgba(231,227,212,0.6)', // secondary text
        hairline: 'rgba(231,227,212,0.10)', // borders, dividers
        // NOTE: gold is never a CSS value — it only ever comes from footage/imagery.
      },
      fontFamily: {
        // Authored voice (warm) vs clinical voice (cold).
        serif: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        // Swap point: replace 'Archivo' with '"Suisse Int\'l"' if licensed.
        grotesque: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        label: '0.18em', // wide-tracked uppercase labels/tags
      },
      maxWidth: {
        grid: '1440px',
      },
      transitionTimingFunction: {
        // calm, weighted ease-out used everywhere
        void: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
