import { useNavigate, useParams } from 'react-router-dom'
import { MONTHS, formatDate } from '@shared/money'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api } from '@/lib/api'
import { ui } from '@/lib/utils'

/** S15 Earnings Month Detail: the bills and payments that make up one month (EA-6). */
export default function MonthDetail() {
  const { year, month } = useParams(), nav = useNavigate(), money = useMoney()
  const { data } = useAsync(() => api.earnings.month(Number(year), Number(month)), [year, month])
  return (
    <div>
      <Button onClick={() => nav('/earnings')}>Back to Earnings</Button>
      <h1 className={ui.h1 + ' mt-3'}>{MONTHS[Number(month) - 1]} {year}</h1>
      <h2 className={ui.h2}>Payments received</h2>
      {data?.payments.length ? <div className={ui.card + ' p-0'}><table className="w-full"><tbody>{data.payments.map((p) => <tr key={p.id}><td className={ui.td}>{formatDate(p.date)}</td><td className={ui.td}>{p.clientName}</td><td className={ui.td}>{money(p.amount)}</td><td className={ui.td + ' text-muted-foreground'}>{p.note}</td></tr>)}</tbody></table></div> : <p>No payments this month.</p>}
      <h2 className={ui.h2}>Bills created</h2>
      {data?.bills.length ? <div className={ui.card + ' p-0'}><table className="w-full"><tbody>{data.bills.map((b) => <tr key={b.id}><td className={ui.td}>{formatDate(b.date)}</td><td className={ui.td}>{b.clientName}</td><td className={ui.td}>{money(b.total)}</td><td className={ui.td}><StatusBadge balance={b.balance} /></td><td className={ui.td}><Button onClick={() => nav(`/bills/${b.id}`)}>Open Bill</Button></td></tr>)}</tbody></table></div> : <p>No bills this month.</p>}
    </div>
  )
}
