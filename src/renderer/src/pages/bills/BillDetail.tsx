import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '@shared/money'
import type { Payment } from '@shared/types'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api, mutate } from '@/lib/api'
import { ui } from '@/lib/utils'
import { BillFormDialog } from './BillForm'
import { PaymentDialog } from './PaymentDialog'

/** S11 Bill Detail. Status is always calculated from payments, never typed in (BI-3). */
export default function BillDetail() {
  const id = Number(useParams().id), nav = useNavigate(), money = useMoney()
  const { data: b, loading } = useAsync(() => api.bills.get(id), [id])
  const [dlg, setDlg] = useState<'pay' | 'edit' | 'del' | null>(null)
  const [editPay, setEditPay] = useState<Payment | null>(null), [delPay, setDelPay] = useState<Payment | null>(null)
  if (loading) return null
  if (!b) return <div><Button onClick={() => nav('/bills')}>Back to Bills</Button><p className="mt-4">This bill no longer exists.</p></div>
  return (
    <div>
      <Button onClick={() => nav('/bills')}>Back to Bills</Button>
      <div className={ui.card + ' mt-3'}>
        <h1 className={ui.h1}>{b.clientName}</h1>
        <p className="text-muted-foreground">{b.clientPhone} · {formatDate(b.date)}</p>
        {b.notes && <p className="mt-2">{b.notes}</p>}
        <div className="my-3">{b.garments.map((g) => <div key={g.id} className="flex justify-between py-1"><span>{g.description}</span><span>{money(g.price)}</span></div>)}
          {b.discount > 0 && <div className="flex justify-between py-1 text-muted-foreground"><span>Discount</span><span>−{money(b.discount)}</span></div>}</div>
        <p className="border-t pt-3 text-lg">Total <b>{money(b.total)}</b> · Paid <b>{money(b.paid)}</b> · Balance <b>{money(b.balance)}</b></p>
        <div className="mt-2"><StatusBadge balance={b.balance} /></div>
      </div>
      <div className="my-4 flex flex-wrap gap-3">
        {b.balance > 0 && <Button variant="primary" onClick={() => setDlg('pay')}>Record Payment</Button>}
        <Button onClick={() => setDlg('edit')}>Edit Bill</Button><Button onClick={() => nav(`/clients/${b.clientId}`)}>Open Client</Button>
        <Button variant="dangerOutline" onClick={() => setDlg('del')}>Delete Bill</Button>
      </div>
      <h2 className={ui.h2}>Payments</h2>
      {b.payments.length === 0 ? <p>No payments yet.</p> : (
        <div className={ui.card + ' p-0'}><table className="w-full"><tbody>{b.payments.map((p) => (
          <tr key={p.id}><td className={ui.td}>{formatDate(p.date)}</td><td className={ui.td}>{money(p.amount)}</td><td className={ui.td + ' text-muted-foreground'}>{p.note}</td>
            <td className={ui.td + ' text-right'}><Button onClick={() => setEditPay(p)}>Edit</Button> <Button variant="dangerOutline" onClick={() => setDelPay(p)}>Delete</Button></td></tr>))}</tbody></table></div>
      )}
      {dlg === 'pay' && <PaymentDialog billId={b.id} balance={b.balance} onClose={() => setDlg(null)} />}
      {editPay && <PaymentDialog billId={b.id} balance={b.balance} payment={editPay} onClose={() => setEditPay(null)} />}
      {delPay && <ConfirmDeleteDialog title="Delete this payment?" message={`The payment of ${money(delPay.amount)} on ${formatDate(delPay.date)} will be deleted. The bill balance will go up.`} onConfirm={() => mutate(api.payments.remove(delPay.id))} onClose={() => setDelPay(null)} />}
      {dlg === 'edit' && <BillFormDialog bill={b} onClose={() => setDlg(null)} />}
      {dlg === 'del' && <ConfirmDeleteDialog title="Delete this bill?" message={`This bill and its ${b.payments.length} payments will be deleted. The garments stay on the client.`} onConfirm={async () => { await mutate(api.bills.remove(b.id)); nav('/bills') }} onClose={() => setDlg(null)} />}
    </div>
  )
}
