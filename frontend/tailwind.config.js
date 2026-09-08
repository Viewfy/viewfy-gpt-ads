const ACCENT = [110, 181, 255]

function mix(toward, t) {
  return ACCENT.map((c, i) => Math.round(c + (toward[i] - c) * t)).join(' ')
}

function scale() {
  const shades = {
    50: mix([255, 255, 255], 0.92),
    100: mix([255, 255, 255], 0.80),
    200: mix([255, 255, 255], 0.60),
    300: mix([255, 255, 255], 0.35),
    400: ACCENT.join(' '),
    500: mix([0, 0, 0], 0.12),
    600: mix([0, 0, 0], 0.28),
    700: mix([0, 0, 0], 0.45),
  }
  return Object.fromEntries(
    Object.entries(shades).map(([k, rgb]) => [k, `rgb(${rgb} / <alpha-value>)`]),
  )
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { accent: scale() },
      fontFamily: {
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    function injectAccent({ addBase }) {
      addBase({ ':root': { '--accent': ACCENT.join(' ') } })
    },
  ],
}
