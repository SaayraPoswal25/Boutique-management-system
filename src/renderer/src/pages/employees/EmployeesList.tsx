import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api } from '@/lib/api'
import { cn, ui } from '@/lib/utils'
import { EmployeeFormDialog } from './EmployeeForm'
import { EntryDialog } from './EntryDialog'

/** S16 Employees List. "Record Today's Work" is the daily shortcut. */
export default function EmployeesList() {
  const { data } = useAsync(() => api.employees.list(false), []), nav = useNavigate(), money = useMoney()
  const [dlg, setDlg] = useState<'add' | 'work' | null>(null)
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3"><h1 className={cn(ui.h1, 'flex-1')}>Employees</h1>
        <Button onClick={() => setDlg('work')}>Record Today’s Work</Button><Button variant="primary" onClick={() => setDlg('add')}>Add New Employee</Button></div>
      {data?.length === 0 && <EmptyState message="No employees yet." actionLabel="Add Your First Employee" onAction={() => setDlg('add')} />}
      {!!data?.length && (
        <div className={cn(ui.card, 'overflow-x-auto p-0')}><table className="w-full"><thead><tr>{['Name', 'Phone', 'Balance owed', 'Status', ''].map((h) => <th key={h} className={ui.th}>{h}</th>)}</tr></thead>
          <tbody>{data.map((e) => <tr key={e.id}><td className={ui.td}>{e.name}</td><td className={ui.td}>{e.phone}</td>
            <td className={ui.td}>{e.balance < 0 ? <span className="text-danger">Employee owes {money(-e.balance)}</span> : money(e.balance)}</td>
            <td className={ui.td}>{e.isActive ? 'Working' : 'No Longer Working'}</td><td className={ui.td}><Button onClick={() => nav(`/employees/${e.id}`)}>Open</Button></td></tr>)}</tbody></table></div>
      )}
      {dlg === 'add' && <EmployeeFormDialog onClose={() => setDlg(null)} />}
      {dlg === 'work' && <EntryDialog kind="work" onClose={() => setDlg(null)} />}
    </div>
  )
}
