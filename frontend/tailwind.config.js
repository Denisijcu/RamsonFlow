/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        'rf-dark': '#0a0a0f',
        'rf-panel': '#0f0f1a',
        'rf-border': '#1a1a2e',
        'rf-red': '#ff2244',
        'rf-orange': '#ff6b00',
        'rf-cyan': '#00d4ff',
        'rf-green': '#00ff88',
        'rf-purple': '#7c3aed',
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        'display': ['"Rajdhani"', 'sans-serif'],
      },
      animation: {
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'glitch': 'glitch 0.3s ease-in-out',
      }
    },
  },
  plugins: [],
}
