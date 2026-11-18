import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_SETTINGS, type Settings } from '@shared/types'
import { formatRupees } from '@shared/money'
import { api } from '@/lib/api'
import { bump } from '@/lib/dataVersion'

const Ctx = createContext<{ settings: Settings; update: (p: Partial<Settings>) => Promise<void> } | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  useEffect(() => { api.settings.get().then(setSettings).catch(() => setSettings(DEFAULT_SETTINGS)) }, [])
  useEffect(() => { if (settings) document.documentElement.dataset.textSize = settings.textSize }, [settings?.textSize])
  if (!settings) return null
  const update = async (p: Partial<Settings>) => { setSettings(await api.settings.set(p)); bump() }
  return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>
}
export function useSettings() {
  const c = useContext(Ctx)
  if (!c) throw new Error('SettingsProvider is missing')
  return c
}
export const useMoney = () => { const { settings } = useSettings(); return (n: number) => formatRupees(n, settings.currencySymbol) }
