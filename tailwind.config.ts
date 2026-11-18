import type { Config } from 'tailwindcss'
const c = (n: string) => `hsl(var(--${n}) / <alpha-value>)`
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: c('background'), foreground: c('foreground'), card: c('card'),
        muted: c('muted'), 'muted-foreground': c('muted-foreground'), border: c('border'),
        primary: c('primary'), 'primary-foreground': c('primary-foreground'),
        success: c('success'), 'success-soft': c('success-soft'),
        danger: c('danger'), 'danger-soft': c('danger-soft')
      }
    }
  },
  plugins: []
} satisfies Config
