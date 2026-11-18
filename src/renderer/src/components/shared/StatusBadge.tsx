import { useMoney } from '@/hooks/useSettings'
import { cn } from '@/lib/utils'

/** BI-6: words AND colour together. */
export function StatusBadge({ balance }: { balance: number }) {
  const money = useMoney()
  const due = balance > 0
  return <span className={cn('inline-block rounded-full px-3 py-0.5 text-sm font-semibold', due ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success')}>{due ? `${money(balance)} Due` : 'Paid'}</span>
}
