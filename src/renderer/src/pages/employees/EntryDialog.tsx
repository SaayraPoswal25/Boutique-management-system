import { todayISO } from '@shared/money'
import type { Employee, Entry, EntryKind } from '@shared/types'
import { FormDialog, type FieldDef } from '@/components/shared/FormDialog'
import { useAsync } from '@/hooks/useAsync'
import { api, mutate } from '@/lib/api'
import { amountSchema, check } from '@/lib/schemas'

const KIND = {
  work: { title: 'Add Work Entry', save: 'Save Work Entry', text: 'What work was done? (e.g. 2 blouses stitched)', required: true },
  advance: { title: 'Give Advance', save: 'Save Advance', text: 'Note (optional)', required: false },
  payout: { title: 'Pay Employee', save: 'Save Payout', text: 'Note (optional)', required: false }
} as const

/** S19 / S20 / S21 in one dialog. `employee` omitted -> shows a picker (the "Record Today's Work" shortcut). */
export function EntryDialog({ kind, employee, entry, onClose }: { kind: EntryKind; employee?: Employee; entry?: Entry; onClose: () => void }) {
  const k = KIND[kind]
  const emps = useAsync(() => (employee ? Promise.resolve([]) : api.employees.list(true)), []).data ?? []
  const fields: FieldDef[] = [
    ...(employee ? [] : [{ name: 'employeeId', label: 'Employee', type: 'select' as const, options: emps.map((e) => e.name), required: true }]),
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'text', label: k.text, voice: true, required: k.required },
    { name: 'amount', label: 'Amount', type: 'number', required: true }
  ]
  return (
    <FormDialog title={entry ? 'Edit Entry' : k.title} saveLabel={k.save} savedMessage="Saved" onClose={onClose} fields={fields}
      initial={{ employeeId: emps[0]?.name ?? '', date: entry?.date ?? todayISO(), text: entry?.text ?? '', amount: String(entry?.amount ?? (kind === 'payout' && employee ? Math.max(0, employee.balance) : '')) }}
      validate={check(amountSchema)}
      onSave={async (v) => {
        const i = { date: v.date, amount: Number(v.amount), text: v.text }
        const target = employee ?? emps.find((e) => e.name === v.employeeId)
        if (entry) await mutate(api.employees.updateEntry(kind, entry.id, i))
        else if (target) await mutate(api.employees.addEntry(target.id, kind, i))
      }} />
  )
}
