/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: '#000623',
        blue: '#5768FF',
        orange: '#F6704C',
        off: '#F9F9F9',
        surface: { 1: '#0A1037', 2: '#131C4D' },
      },
      fontFamily: {
        sans: ['Manrope', 'Roobert', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        h1: ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        h2: ['2rem', { lineHeight: '1.2', letterSpacing: '-0.005em' }],
        h3: ['1.5rem', { lineHeight: '1.25' }],
        h4: ['1.25rem', { lineHeight: '1.3' }],
        lead: ['1.25rem', { lineHeight: '1.25' }],
        body: ['1.125rem', { lineHeight: '1.5' }],
        small: ['1rem', { lineHeight: '1.5' }],
        caption: ['0.875rem', { lineHeight: '1.5' }],
      },
      spacing: {
        18: '4.5rem',
        128: '32rem',
      },
    },
  },
  plugins: [],
};
