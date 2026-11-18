import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

const Ctx = createContext<(m: string) => void>(() => {})
export const useToast = () => useContext(Ctx)

/** UI-6: a clear message after every save ("Client saved"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const show = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }, [])
  return (
    <Ctx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
        {msg && <div className="rounded-lg bg-success px-5 py-3 font-semibold text-white shadow-lg">{msg}</div>}
      </div>
    </Ctx.Provider>
  )
}
