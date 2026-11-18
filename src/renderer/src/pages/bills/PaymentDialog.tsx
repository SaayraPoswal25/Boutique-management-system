import { todayISO } from '@shared/money'
import type { ID, Payment } from '@shared/types'
import { FormDialog } from '@/components/shared/FormDialog'
import { useMoney } from '@/hooks/useSettings'
import { api, mutate } from '@/lib/api'
import { check, paymentSchema } from '@/lib/schemas'

/** S12 Record Payment. Amount defaults to the balance (BI-2) and can never exceed it (BI-4). */
export function PaymentDialog({ billId, balance, payment, onClose }: { billId: ID; balance: number; payment?: Payment; onClose: () => void }) {
  const money = useMoney()
  const max = payment ? balance + payment.amount : balance // editing: its own amount is free again
  return (
    <FormDialog title={payment ? 'Edit Payment' : 'Record Payment'} saveLabel="Save Payment" savedMessage="Payment saved" onClose={onClose}
      fields={[{ name: 'date', label: 'Date', type: 'date', required: true }, { name: 'amount', label: 'Amount', type: 'number', required: true }, { name: 'note', label: 'Note (cash, UPI, etc.)', voice: true }]}
      initial={{ date: payment?.date ?? todayISO(), amount: String(payment?.amount ?? balance), note: payment?.note ?? '' }}
      validate={check(paymentSchema(max, money))}
      extra={<p className="mb-4 text-muted-foreground">Balance due now: {money(balance)}</p>}
      onSave={async (v) => {
        const i = { date: v.date, amount: Number(v.amount), note: v.note }
        await mutate(payment ? api.payments.update(payment.id, i) : api.payments.create(billId, i))
      }} />
  )
}
