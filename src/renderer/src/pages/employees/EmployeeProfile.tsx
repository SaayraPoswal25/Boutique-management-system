import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '@shared/money'
import type { Entry, EntryKind } from '@shared/types'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { Tabs } from '@/components/shared/Tabs'
import { useToast } from '@/components/shared/Toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api, mutate } from '@/lib/api'
import { ui } from '@/lib/utils'
import { EmployeeFormDialog } from './EmployeeForm'
import { EntryDialog } from './EntryDialog'

const TABS: Record<string, EntryKind> = { 'Work Done': 'work', 'Advances Taken': 'advance', Payouts: 'payout' }

/** S18 Employee Profile: big balance, this-month summary, three lists with date filters (EM-6 to EM-10). */
export default function EmployeeProfile() {
  const id = Number(useParams().id), nav = useNavigate(), money = useMoney(), toast = useToast()
  const emp = useAsync(() => api.employees.get(id), [id]), month = useAsync(() => api.employees.monthSummary(id), [id]).data
  const [tab, setTab] = useState('Work Done'), [from, setFrom] = useState(''), [to, setTo] = useState('')
  const kind = TABS[tab]
  const entries = useAsync(() => api.employees.entries(id, kind, from || undefined, to || undefined), [id, kind, from, to]).data ?? []
  const [dlg, setDlg] = useState<EntryKind | 'edit' | null>(null), [editing, setEditing] = useState<Entry | null>(null), [deleting, setDeleting] = useState<Entry | null>(null)
  const e = emp.data
  if (emp.loading) return null
  if (!e) return <div><Button onClick={() => nav('/employees')}>Back to Employees</Button><p className="mt-4">This employee no longer exists.</p></div>
  return (
    <div>
      <Button onClick={() => nav('/employees')}>Back to Employees</Button>
      <div className={ui.card + ' mt-3'}>
        <h1 className={ui.h1}>{e.name}</h1><p className="text-muted-foreground">{e.phone}{e.isActive ? '' : ' · No Longer Working'}</p>
        <p className={'mt-3 text-3xl font-bold ' + (e.balance < 0 ? 'text-danger' : '')}>{e.balance < 0 ? `Employee owes ${money(-e.balance)}` : `Balance owed: ${money(e.balance)}`}</p>
        {month && <p className="mt-2 text-muted-foreground">This month: earned {money(month.earned)}, advances {money(month.advances)}, balance {money(month.balance)}</p>}
      </div>
      <div className="my-4 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setDlg('work')}>Add Work Entry</Button><Button onClick={() => setDlg('advance')}>Give Advance</Button><Button onClick={() => setDlg('payout')}>Pay Employee</Button>
        <Button onClick={() => setDlg('edit')}>Edit Employee</Button>
        <Button onClick={async () => { await mutate(api.employees.setActive(e.id, !e.isActive)); toast('Saved') }}>{e.isActive ? 'Mark as No Longer Working' : 'Mark as Working Again'}</Button>
      </div>
      <Tabs tabs={Object.keys(TABS)} value={tab} onChange={setTab} />
      <div className="mb-3 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2">From <Input type="date" className="w-auto" value={from} onChange={(x) => setFrom(x.target.value)} /></label>
        <label className="flex items-center gap-2">To <Input type="date" className="w-auto" value={to} onChange={(x) => setTo(x.target.value)} /></label>
        <b>Total: {money(entries.reduce((s, x) => s + x.amount, 0))}</b></div>
      {entries.length === 0 ? <p>Nothing here yet.</p> : (
        <div className={ui.card + ' overflow-x-auto p-0'}><table className="w-full"><tbody>{entries.map((x) => (
          <tr key={x.id}><td className={ui.td}>{formatDate(x.date)}</td><td className={ui.td}>{x.text || '-'}</td><td className={ui.td}>{money(x.amount)}</td>
            <td className={ui.td + ' text-right'}><Button onClick={() => setEditing(x)}>Edit</Button> <Button variant="dangerOutline" onClick={() => setDeleting(x)}>Delete</Button></td></tr>))}</tbody></table></div>
      )}
      {(dlg === 'work' || dlg === 'advance' || dlg === 'payout') && <EntryDialog kind={dlg} employee={e} onClose={() => setDlg(null)} />}
      {dlg === 'edit' && <EmployeeFormDialog employee={e} onClose={() => setDlg(null)} />}
      {editing && <EntryDialog kind={kind} employee={e} entry={editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDeleteDialog title="Delete this entry?" message={`The entry of ${money(deleting.amount)} on ${formatDate(deleting.date)} will be deleted.`} onConfirm={() => mutate(api.employees.removeEntry(kind, deleting.id))} onClose={() => setDeleting(null)} />}
    </div>
  )
}
