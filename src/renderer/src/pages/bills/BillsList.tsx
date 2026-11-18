import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@shared/money'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Tabs } from '@/components/shared/Tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api } from '@/lib/api'
import { cn, ui } from '@/lib/utils'
import { BillFormDialog } from './BillForm'

/** S9 Bills List: All / Pending / Paid, newest first, search by client name (BI-5). */
export default function BillsList() {
  const [tab, setTab] = useState('All'), [search, setSearch] = useState(''), [creating, setCreating] = useState(false)
  const nav = useNavigate(), money = useMoney()
  const { data } = useAsync(() => api.bills.list({ status: tab === 'All' ? undefined : (tab as 'Pending' | 'Paid'), search }), [tab, search])
  return (
    <div>
      <div className="mb-2 flex items-center gap-3"><h1 className={cn(ui.h1, 'flex-1')}>Bills</h1><Button variant="primary" onClick={() => setCreating(true)}>Create New Bill</Button></div>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs tabs={['All', 'Pending', 'Paid']} value={tab} onChange={setTab} />
        <Input className="max-w-xs flex-1" aria-label="Search bills by client name" placeholder="Search by client name" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {data?.length === 0 && <EmptyState message="No bills found." />}
      {!!data?.length && (
        <div className={cn(ui.card, 'overflow-x-auto p-0')}>
          <table className="w-full"><thead><tr>{['Date', 'Client', 'Total', 'Paid', 'Balance', 'Status', ''].map((h) => <th key={h} className={ui.th}>{h}</th>)}</tr></thead>
            <tbody>{data.map((b) => (
              <tr key={b.id}><td className={ui.td}>{formatDate(b.date)}</td><td className={ui.td}>{b.clientName}</td><td className={ui.td}>{money(b.total)}</td><td className={ui.td}>{money(b.paid)}</td><td className={ui.td}>{money(b.balance)}</td>
                <td className={ui.td}><StatusBadge balance={b.balance} /></td><td className={ui.td}><Button onClick={() => nav(`/bills/${b.id}`)}>Open Bill</Button></td></tr>))}</tbody></table>
        </div>
      )}
      {creating && <BillFormDialog onClose={() => setCreating(false)} onSaved={(id) => nav(`/bills/${id}`)} />}
    </div>
  )
}
