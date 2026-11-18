import { useState } from 'react'
import { formatDate } from '@shared/money'
import { MEASUREMENT_FIELDS, type ID, type Measurement } from '@shared/types'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import { api, mutate } from '@/lib/api'
import { ui } from '@/lib/utils'
import { MEASUREMENT_LABELS, MeasurementFormDialog } from './MeasurementForm'

/** S6: latest first (ME-4); older ones under "Past Measurements". */
export function MeasurementHistory({ clientId, items, onAdd }: { clientId: ID; items: Measurement[]; onAdd: () => void }) {
  const { settings } = useSettings(), [showPast, setShowPast] = useState(false)
  const [editing, setEditing] = useState<Measurement | null>(null), [deleting, setDeleting] = useState<Measurement | null>(null)
  if (!items.length) return <EmptyState message="No measurements yet." actionLabel="Add Measurements" onAction={onAdd} />
  const card = (m: Measurement, latest: boolean) => (
    <div key={m.id} className={ui.card + ' mb-3'}>
      <p className="font-semibold">{latest ? 'Latest' : 'Past'}: {m.garmentType || 'Measurements'} on {formatDate(m.date)}</p>
      <p className="my-2 text-muted-foreground">{MEASUREMENT_FIELDS.filter((k) => m[k] != null).map((k) => `${MEASUREMENT_LABELS[k]} ${m[k]} ${settings.measurementUnit}`).join(', ') || 'No values entered'}</p>
      {m.notes && <p className="mb-2">{m.notes}</p>}
      <div className="flex gap-2"><Button onClick={() => setEditing(m)}>Edit</Button><Button variant="dangerOutline" onClick={() => setDeleting(m)}>Delete</Button></div>
    </div>
  )
  return (
    <div>
      {card(items[0], true)}
      {items.length > 1 && <Button onClick={() => setShowPast(!showPast)}>{showPast ? 'Hide Past Measurements' : `Show Past Measurements (${items.length - 1})`}</Button>}
      {showPast && <div className="mt-3">{items.slice(1).map((m) => card(m, false))}</div>}
      {editing && <MeasurementFormDialog clientId={clientId} edit={editing} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDeleteDialog title="Delete these measurements?" message={`The measurements from ${formatDate(deleting.date)} will be deleted.`} onConfirm={() => mutate(api.measurements.remove(deleting.id))} onClose={() => setDeleting(null)} />}
    </div>
  )
}
