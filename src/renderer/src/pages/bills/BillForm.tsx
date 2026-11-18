import { useState } from 'react'
import { todayISO } from '@shared/money'
import type { BillDetail, Garment, ID } from '@shared/types'
import { FormDialog } from '@/components/shared/FormDialog'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api, mutate } from '@/lib/api'
import { GarmentFormDialog } from '../garments/GarmentForm'

/** S10 Create / Edit Bill: pick garments, discount, notes; total is calculated (BI-1, BR-3). */
export function BillFormDialog({ clientId, bill, onClose, onSaved }: { clientId?: ID; bill?: BillDetail; onClose: () => void; onSaved?: (id: ID) => void }) {
  const money = useMoney()
  const [cid, setCid] = useState<ID | ''>(bill?.clientId ?? clientId ?? '')
  const [picked, setPicked] = useState<ID[]>(bill?.garments.map((g) => g.id) ?? [])
  const [discount, setDiscount] = useState(String(bill?.discount ?? ''))
  const [addingGarment, setAddingGarment] = useState(false)
  const clients = useAsync(() => (clientId || bill ? Promise.resolve([]) : api.clients.list('')), [])
  const garments = useAsync<Garment[]>(() => (cid ? api.garments.listByClient(cid) : Promise.resolve([])), [cid])
  const open = (garments.data ?? []).filter((g) => !g.billId || g.billId === bill?.id)
  const total = open.filter((g) => picked.includes(g.id)).reduce((s, g) => s + g.price, 0) - (Number(discount) || 0)
  const toggle = (id: ID) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const extra = (
    <div className="mb-4">
      {!clientId && !bill && (
        <label className="mb-3 block font-semibold">Client (required)
          <select className="mt-1 min-h-11 w-full rounded-lg border bg-card px-3 text-base font-normal" value={cid} onChange={(e) => { setCid(e.target.value ? Number(e.target.value) : ''); setPicked([]) }}>
            <option value="">Choose a client</option>{(clients.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>
        </label>
      )}
      <p className="mb-1 font-semibold">Garments on this bill</p>
      {open.length === 0 && <p className="mb-2 text-muted-foreground">{cid ? 'No unbilled garments yet.' : 'Choose a client first.'}</p>}
      {open.map((g) => (
        <label key={g.id} className="flex min-h-11 items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={picked.includes(g.id)} onChange={() => toggle(g.id)} />{g.description} - {money(g.price)}</label>
      ))}
      {cid && <Button className="mt-2" onClick={() => setAddingGarment(true)}>Add Garment to Bill</Button>}
      <label className="mt-3 block font-semibold">Discount (optional)
        <input type="number" className="mt-1 min-h-11 w-full rounded-lg border bg-card px-3 text-base font-normal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
      </label>
      <p className="mt-3 text-lg font-bold">Total: {money(total)}</p>
      {addingGarment && cid && <GarmentFormDialog clientId={cid} onClose={() => setAddingGarment(false)} />}
    </div>
  )
  return (
    <FormDialog title={bill ? 'Edit Bill' : 'Create New Bill'} saveLabel="Save Bill" savedMessage="Bill saved" onClose={onClose} extra={extra}
      fields={[{ name: 'date', label: 'Date', type: 'date', required: true }, { name: 'notes', label: 'Notes', type: 'textarea', voice: true }]}
      initial={{ date: bill?.date ?? todayISO(), notes: bill?.notes ?? '' }}
      validate={(): Record<string, string> => {
        if (!cid) return { date: 'Please choose a client first' }
        if (picked.length === 0) return { date: 'Please tick at least one garment' }
        if (total < 0) return { date: 'The discount is more than the total' }
        return {}
      }}
      onSave={async (v) => {
        const i = { clientId: cid as ID, date: v.date, discount: Number(discount) || 0, notes: v.notes, garmentIds: picked }
        const saved = await mutate(bill ? api.bills.update(bill.id, i) : api.bills.create(i))
        onSaved?.(saved.id)
      }} />
  )
}
