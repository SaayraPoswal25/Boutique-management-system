import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { PendingBellButton } from './PendingBellButton'

/** SE-1: one search box, always visible. UI-12: Ctrl/Cmd+F focuses it. */
export function TopBar() {
  const [params] = useSearchParams(), nav = useNavigate(), ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); ref.current?.focus() } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])
  return (
    <header className="flex items-center gap-4 border-b bg-card px-4 py-2">
      <b className="whitespace-nowrap text-lg">Boutique Client Manager</b>
      <Input ref={ref} aria-label="Search clients" placeholder="Search by name or phone number" value={params.get('q') ?? ''}
        onChange={(e) => nav({ pathname: '/', search: e.target.value ? `?q=${encodeURIComponent(e.target.value)}` : '' }, { replace: true })} />
      <PendingBellButton />
    </header>
  )
}
