import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { formatDate } from '@shared/money'
import type { DeletePreview, Garment } from '@shared/types'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Tabs } from '@/components/shared/Tabs'
import { Button } from '@/components/ui/button'
import { useAsync } from '@/hooks/useAsync'
import { useMoney } from '@/hooks/useSettings'
import { api, mutate } from '@/lib/api'
import { ui } from '@/lib/utils'
import { BillFormDialog } from '../bills/BillForm'
import { GarmentDetail } from '../garments/GarmentDetail'
import { GarmentFormDialog } from '../garments/GarmentForm'
import { GarmentPhoto } from '../garments/GarmentPhoto'
import { MeasurementFormDialog } from '../measurements/MeasurementForm'
import { MeasurementHistory } from '../measurements/MeasurementHistory'
import { ClientFormDialog } from './ClientForm'

type Dlg = 'edit' | 'measure' | 'copy' | 'garment' | 'bill' | null

/** S4 Client Profile: the central screen. Everything about one client on one page. */
export default function ClientProfile() {
  const id = Number(useParams().id), nav = useNavigate(), money = useMoney()
  const client = useAsync(() => api.clients.get(id), [id])
  const ms = useAsync(() => api.measurements.listByClient(id), [id])
  const gs = useAsync(() => api.garments.listByClient(id), [id])
  const bs = useAsync(() => api.bills.list({ clientId: id }), [id])
  const [tab, setTab] = useState('Measurements'), [dlg, setDlg] = useState<Dlg>(null), [status, setStatus] = useState('All')
  const [open, setOpen] = useState<Garment | null>(null), [del, setDel] = useState<DeletePreview | null>(null)
  const c = client.data
  if (client.loading) return null
  if (!c) return <div><Button onClick={() => nav('/')}>Back to Clients</Button><p className="mt-4">This client no longer exists.</p></div>
  const measures = ms.data ?? [], garments = (gs.data ?? []).filter((g) => status === 'All' || g.status === status), bills = bs.data ?? []
  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2"><Button onClick={() => nav('/')}>Back to Clients</Button><span className="text-muted-foreground">Clients › {c.name}</span></nav>
      <div className={ui.card}>
        <h1 className={ui.h1}>{c.name}</h1>
        <p className="text-muted-foreground">{c.phone}</p>{c.notes && <p className="mt-1">{c.notes}</p>}
        <p className="mt-3 text-lg">Total pending: <b className={c.pendingAmount > 0 ? 'text-danger' : ''}>{money(c.pendingAmount)}</b></p>
      </div>
      <div className="my-4 flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => setDlg('measure')}>Add Measurements</Button>
        {measures[0] && <Button onClick={() => setDlg('copy')}>Copy From Last Measurement</Button>}
        <Button onClick={() => setDlg('garment')}>Add Garment</Button><Button onClick={() => setDlg('bill')}>Create Bill</Button>
        <Button onClick={() => setDlg('edit')}>Edit Client</Button>
        <Button variant="dangerOutline" onClick={async () => setDel(await api.clients.deletePreview(c.id))}>Delete Client</Button>
      </div>
      <Tabs tabs={['Measurements', 'Garments', 'Bills']} value={tab} onChange={setTab} />
      {tab === 'Measurements' && <MeasurementHistory clientId={c.id} items={measures} onAdd={() => setDlg('measure')} />}
      {tab === 'Garments' && (
        <div>
          <label className="mb-3 flex items-center gap-2 font-semibold">Show
            <select className="min-h-11 rounded-lg border bg-card px-3 font-normal" value={status} onChange={(e) => setStatus(e.target.value)}>{['All', 'In Progress', 'Ready', 'Delivered'].map((s) => <option key={s}>{s}</option>)}</select></label>
          {garments.length === 0 ? <EmptyState message="No garments here yet." actionLabel="Add Garment" onAction={() => setDlg('garment')} /> : garments.map((g) => (
            <div key={g.id} className={ui.card + ' mb-3 flex items-center gap-4'}>
              {g.photos[0] && <GarmentPhoto file={g.photos[0]} className="h-16 w-16" />}
              <div className="flex-1"><b>{g.description}</b><p className="text-muted-foreground">{formatDate(g.dateOrdered)} · {money(g.price)} · {g.status}</p>{g.notes && <p>{g.notes}</p>}</div>
              <Button onClick={() => setOpen(g)}>View</Button>
            </div>))}
        </div>
      )}
      {tab === 'Bills' && (bills.length === 0 ? <EmptyState message="No bills yet." actionLabel="Create Bill" onAction={() => setDlg('bill')} /> : bills.map((b) => (
        <div key={b.id} className={ui.card + ' mb-3 flex items-center gap-4'}><div className="flex-1"><b>{formatDate(b.date)}</b> · {money(b.total)}</div><StatusBadge balance={b.balance} /><Button onClick={() => nav(`/bills/${b.id}`)}>Open Bill</Button></div>)))}

      {dlg === 'edit' && <ClientFormDialog client={c} onClose={() => setDlg(null)} />}
      {dlg === 'measure' && <MeasurementFormDialog clientId={c.id} onClose={() => setDlg(null)} />}
      {dlg === 'copy' && <MeasurementFormDialog clientId={c.id} prefill={measures[0]} onClose={() => setDlg(null)} />}
      {dlg === 'garment' && <GarmentFormDialog clientId={c.id} onClose={() => setDlg(null)} />}
      {dlg === 'bill' && <BillFormDialog clientId={c.id} onClose={() => setDlg(null)} onSaved={(bid) => nav(`/bills/${bid}`)} />}
      {open && <GarmentDetail garment={open} onClose={() => setOpen(null)} />}
      {del && <ConfirmDeleteDialog title={`Delete ${c.name}?`} doneMessage="Client deleted" onClose={() => setDel(null)}
        message={`This will also delete ${del.measurements} measurements, ${del.garments} garments and ${del.bills} bills. This cannot be undone.`}
        onConfirm={async () => { await mutate(api.clients.remove(c.id)); nav('/') }} />}
    </div>
  )
}
