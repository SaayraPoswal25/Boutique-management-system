import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api } from '@/lib/api'
import { cn, ui } from '@/lib/utils'
import { formatDate } from '@shared/money'
import { ClientFormDialog } from './ClientForm'

/** S2 Clients List (home). Search comes from the top bar (?q=). SE-5: nothing found -> prefilled Add. */
export default function ClientsList() {
  const q = useSearchParams()[0].get('q')?.trim() ?? '', nav = useNavigate(), money = useMoney()
  const { data, error } = useAsync(() => api.clients.list(q), [q])
  const [adding, setAdding] = useState(false)
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <h1 className={cn(ui.h1, 'flex-1')}>Clients</h1>
        <Button variant={data?.length ? 'primary' : 'outline'} onClick={() => setAdding(true)}>Add New Client</Button>
      </div>
      {error && <p className="text-danger">{error}</p>}
      {data?.length === 0 && (q
        ? <EmptyState message="No client found" actionLabel="Add New Client" onAction={() => setAdding(true)} />
        : <EmptyState message="You have no clients yet." actionLabel="Add Your First Client" onAction={() => setAdding(true)} />)}
      {!!data?.length && (
        <div className={cn(ui.card, 'overflow-x-auto p-0')}>
          <table className="w-full"><thead><tr>{['Name', 'Phone', 'Pending', 'Last visit', ''].map((h) => <th key={h} className={ui.th}>{h}</th>)}</tr></thead>
            <tbody>{data.map((c) => (
              <tr key={c.id}>
                <td className={ui.td}>{c.name}</td><td className={ui.td}>{c.phone}</td>
                <td className={ui.td}>{c.pendingAmount > 0 ? <span className="rounded-full bg-danger-soft px-3 py-0.5 text-sm font-semibold text-danger">{money(c.pendingAmount)}</span> : <span className="text-muted-foreground">None</span>}</td>
                <td className={ui.td}>{c.lastVisit ? formatDate(c.lastVisit) : '-'}</td>
                <td className={ui.td}><Button onClick={() => nav(`/clients/${c.id}`)}>Open</Button></td>
              </tr>))}</tbody></table>
        </div>
      )}
      {adding && <ClientFormDialog initial={q ? (/\d/.test(q) ? { phone: q } : { name: q }) : undefined} onClose={() => setAdding(false)} onSaved={(c) => nav(`/clients/${c.id}`)} />}
    </div>
  )
}
