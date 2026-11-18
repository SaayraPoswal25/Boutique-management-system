import { useEffect, useState } from 'react'
import { friendly } from '@/lib/api'
import { useDataVersion } from '@/lib/dataVersion'

/** Loads data and reloads whenever anything is saved anywhere in the app. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const version = useDataVersion()
  const [s, set] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null })
  useEffect(() => {
    let live = true
    fn().then((data) => live && set({ data, loading: false, error: null }))
      .catch((e) => live && set({ data: null, loading: false, error: friendly(e) }))
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps])
  return s
}
