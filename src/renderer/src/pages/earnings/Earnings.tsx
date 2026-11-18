import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MONTHS } from '@shared/money'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api } from '@/lib/api'
import { cn, ui } from '@/lib/utils'

/** S14 Earnings. Received = payments by payment date; Billed = bills by bill date (BR-5). */
export default function Earnings() {
  const now = new Date(), [year, setYear] = useState(now.getFullYear()), [all, setAll] = useState(false)
  const nav = useNavigate(), money = useMoney()
  const months = useAsync(() => api.earnings.year(year), [year]).data ?? []
  const years = useAsync(() => api.earnings.allYears(), []).data ?? []
  const thisMonth = months.find((m) => m.month === now.getMonth() + 1)
  const total = months.reduce((s, m) => ({ billed: s.billed + m.billed, received: s.received + m.received, pending: s.pending + m.pending }), { billed: 0, received: 0, pending: 0 })
  const chart = months.map((m) => ({ name: MONTHS[m.month - 1].slice(0, 3), Received: m.received }))
  return (
    <div>
      <h1 className={ui.h1}>Earnings</h1>
      <div className="my-3 flex items-center gap-3"><Button onClick={() => setYear(year - 1)}>Previous Year</Button><b className="text-xl">{year}</b><Button onClick={() => setYear(year + 1)}>Next Year</Button></div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className={ui.card}><p className="text-muted-foreground">This Month (money received)</p><p className="text-3xl font-bold">{money(thisMonth?.received ?? 0)}</p></div>
        <div className={ui.card}><p className="text-muted-foreground">This Year (money received)</p><p className="text-3xl font-bold">{money(total.received)}</p></div>
      </div>
      <div className={cn(ui.card, 'mb-4 h-64')}>
        <ResponsiveContainer width="100%" height="100%"><BarChart data={chart}><XAxis dataKey="name" /><YAxis width={70} tickFormatter={(v: number) => money(v)} /><Tooltip formatter={(v) => money(Number(v))} /><Bar dataKey="Received" fill="hsl(224 76% 48%)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
      <div className={cn(ui.card, 'overflow-x-auto p-0')}>
        <table className="w-full"><thead><tr>{['Month', 'Billed', 'Received', 'Still Pending', ''].map((h) => <th key={h} className={ui.th}>{h}</th>)}</tr></thead>
          <tbody>{months.map((m) => (<tr key={m.month}><td className={ui.td}>{MONTHS[m.month - 1]}</td><td className={ui.td}>{money(m.billed)}</td><td className={ui.td}>{money(m.received)}</td><td className={ui.td}>{money(m.pending)}</td>
            <td className={ui.td}><Button onClick={() => nav(`/earnings/${year}/${m.month}`)}>View Details</Button></td></tr>))}
            <tr className="font-bold"><td className={ui.td}>Year total</td><td className={ui.td}>{money(total.billed)}</td><td className={ui.td}>{money(total.received)}</td><td className={ui.td}>{money(total.pending)}</td><td className={ui.td} /></tr></tbody></table>
      </div>
      <div className="mt-4"><Button onClick={() => setAll(!all)}>{all ? 'Hide All Years' : 'Show All Years'}</Button></div>
      {all && <div className={cn(ui.card, 'mt-3')}>{years.length === 0 ? 'No earnings yet.' : years.map((y) => <p key={y.year} className="flex justify-between py-1"><span>{y.year}</span><b>{money(y.received)}</b></p>)}</div>}
    </div>
  )
}
