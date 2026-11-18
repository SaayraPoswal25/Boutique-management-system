import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { usePendingBills } from '@/hooks/usePendingBills'

/** NO-1 / NO-2 / NO-5: icon + words, with a live red count. */
export function PendingBellButton() {
  const { count } = usePendingBills(), nav = useNavigate()
  return (
    <Button onClick={() => nav('/pending')} className="relative">
      <Bell size={18} aria-hidden />Pending Bills
      {count > 0 && <span className="absolute -right-2 -top-2 min-w-6 rounded-full bg-danger px-1.5 text-center text-sm text-white">{count}</span>}
    </Button>
  )
}
