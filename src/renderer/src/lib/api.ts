import { bump } from './dataVersion'

export const api = window.api

/** Wrap every save/delete: runs it, then refreshes all screens. */
export async function mutate<T>(p: Promise<T>): Promise<T> { const r = await p; bump(); return r }

/** Never show technical text. Only messages the main process marks "USER:" are shown. */
export function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : ''
  const i = m.indexOf('USER:')
  return i >= 0 ? m.slice(i + 5).trim() : 'Something went wrong. Please try again.'
}
