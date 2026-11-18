import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@shared/money'
import type { PendingBill } from '@shared/types'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { usePendingBills } from '@/hooks/usePendingBills'
import { useMoney, useSettings } from '@/hooks/useSettings'
import { cn, ui } from '@/lib/utils'
import { PaymentDialog } from './PaymentDialog'

/** S13 Pending Bills (opened from the bell, NO-4). Older than the warning days is highlighted (NO-6). */
export default function PendingBillsPanel() {
  const { list, total } = usePendingBills(), nav = useNavigate(), money = useMoney(), { settings } = useSettings()
  const [paying, setPaying] = useState<PendingBill | null>(null)
  return (
    <div>
      <h1 className={ui.h1}>Pending Bills</h1>
      <p className="mb-4 text-muted-foreground">{list.length} bills, {money(total)} still to receive</p>
      {list.length === 0 ? <EmptyState message="No pending bills. Everything is paid." /> : (
        <div className={cn(ui.card, 'overflow-x-auto p-0')}>
          <table className="w-full"><thead><tr>{['Client', 'Phone', 'Amount due', 'Bill date', 'Age', ''].map((h) => <th key={h} className={ui.th}>{h}</th>)}</tr></thead>
            <tbody>{list.map((b) => (
              <tr key={b.billId} className={b.ageDays > settings.pendingWarnDays ? 'bg-danger-soft' : ''}>
                <td className={ui.td}>{b.clientName}</td><td className={ui.td}>{b.clientPhone}</td><td className={ui.td}><b>{money(b.balance)}</b></td><td className={ui.td}>{formatDate(b.date)}</td><td className={ui.td}>{b.ageDays} days</td>
                <td className={ui.td + ' flex gap-2'}><Button variant="primary" onClick={() => setPaying(b)}>Record Payment</Button><Button onClick={() => nav(`/clients/${b.clientId}`)}>Open Client</Button></td></tr>))}</tbody></table>
        </div>
      )}
      <div className="mt-4"><Button onClick={() => nav('/bills')}>Close</Button></div>
      {paying && <PaymentDialog billId={paying.billId} balance={paying.balance} onClose={() => setPaying(null)} />}
    </div>
  )
}
