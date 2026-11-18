import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...i: ClassValue[]) => twMerge(clsx(i))
export const digits = (s: string) => s.replace(/\D/g, '')
/** Shared class strings so every screen looks the same. */
export const ui = {
  h1: 'text-2xl font-bold', h2: 'mb-2 mt-6 text-lg font-semibold',
  card: 'rounded-xl border bg-card p-4', th: 'p-3 text-left text-sm font-medium text-muted-foreground',
  td: 'border-t p-3', input: 'min-h-11 w-full rounded-lg border bg-card px-3 py-2 text-base'
}
