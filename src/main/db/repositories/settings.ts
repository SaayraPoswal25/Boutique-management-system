import { DEFAULT_SETTINGS, type Settings } from '@shared/types'
import { all, run, tx, userError } from '../util'

export function getSettings(): Settings {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  for (const r of all<{ key: string; value: string }>('SELECT key, value FROM settings')) {
    if (!(r.key in DEFAULT_SETTINGS)) continue
    try { out[r.key] = JSON.parse(r.value) } catch { /* keep the default */ }
  }
  return out as unknown as Settings
}

export function setSettings(p: Partial<Settings>): Settings {
  if (p.textSize !== undefined && !['normal', 'large', 'xlarge'].includes(p.textSize)) throw userError('That text size is not valid.')
  if (p.measurementUnit !== undefined && !['in', 'cm'].includes(p.measurementUnit)) throw userError('That measurement unit is not valid.')
  if (p.pendingWarnDays !== undefined && !(Number.isFinite(p.pendingWarnDays) && p.pendingWarnDays >= 0)) throw userError('Please enter a number of days.')
  tx(() => {
    for (const [k, v] of Object.entries(p)) {
      if (k in DEFAULT_SETTINGS && v !== undefined) {
        run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k, JSON.stringify(v))
      }
    }
  })
  return getSettings()
}

export const settings = { get: getSettings, set: setSettings }
