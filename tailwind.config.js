/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FBAE00',
          hover: '#ffc03d',
        },
        surface: 'var(--bg-surface)',
        sidebar: 'var(--bg-sidebar)',
        card: 'var(--bg-card)',
        muted: 'var(--text-muted)',
      },
      borderRadius: {
        'main': 'var(--radius-main)',
        'sub': 'var(--radius-sub)',
      }
    },
  },
  plugins: [],
}