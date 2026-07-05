/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        squadr: {
          bg: 'var(--squadr-bg)',
          surface: 'var(--squadr-surface)',
          band: 'var(--squadr-band)',
          ink: 'var(--squadr-ink)',
          border: 'var(--squadr-border)',
          accent: 'var(--squadr-accent)',
          text: 'var(--squadr-text)',
          muted: 'var(--squadr-text-muted)',
          secondary: 'var(--squadr-text-secondary)',
          'on-accent': 'var(--squadr-on-accent)',
          nav: 'var(--squadr-nav-bg)',
        },
      },
    },
  },
  plugins: [],
};
