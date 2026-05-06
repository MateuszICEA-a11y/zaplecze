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
        white: '#FFFFFF',
        surface: {
          0: '#000623',
          1: '#0A1037',
          2: '#131C4D',
          3: '#1B2664',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Roobert', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      fontSize: {
        // Display – aggressive negative tracking (Linear DNA)
        'display-2xl': ['clamp(3.5rem, 8vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.04em', fontWeight: '600' }],
        'display-xl': ['clamp(2.75rem, 6vw, 4.5rem)', { lineHeight: '1.0', letterSpacing: '-0.035em', fontWeight: '600' }],
        'display-lg': ['clamp(2.25rem, 4.5vw, 3.25rem)', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '600' }],
        // Headings
        h1: ['clamp(2rem, 4vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        h2: ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
        h3: ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        h4: ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        // Body
        lead: ['1.25rem', { lineHeight: '1.55', letterSpacing: '-0.005em' }],
        body: ['1.0625rem', { lineHeight: '1.65' }],
        small: ['0.9375rem', { lineHeight: '1.55' }],
        caption: ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
        eyebrow: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em', fontWeight: '600' }],
      },
      spacing: {
        18: '4.5rem',
        128: '32rem',
      },
      maxWidth: {
        content: '720px',
        default: '1280px',
        wide: '1440px',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        // Linear: minimal shadows, only for interactive depth
        'glow-blue': '0 0 32px -4px rgb(87 104 255 / 0.35)',
        'glow-orange': '0 0 32px -4px rgb(246 112 76 / 0.30)',
      },
      backgroundImage: {
        'mesh-hero': 'radial-gradient(at 18% 22%, rgb(87 104 255 / 0.20) 0%, transparent 55%), radial-gradient(at 82% 78%, rgb(246 112 76 / 0.10) 0%, transparent 50%)',
        'mesh-cta': 'radial-gradient(at 50% 100%, rgb(87 104 255 / 0.18) 0%, transparent 60%)',
        'gradient-card': 'linear-gradient(135deg, #0A1037 0%, #131C4D 100%)',
      },
      animation: {
        'mesh-pan': 'mesh-pan 60s linear infinite',
        'logo-pulse': 'logo-pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'mesh-pan': {
          '0%': { backgroundPosition: '0% 0%, 100% 100%' },
          '50%': { backgroundPosition: '8% 4%, 92% 96%' },
          '100%': { backgroundPosition: '0% 0%, 100% 100%' },
        },
        'logo-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.55', transform: 'scale(0.78)' },
        },
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
