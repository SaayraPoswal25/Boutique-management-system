import { MEASUREMENT_FIELDS, type ID, type Measurement, type MeasurementInput } from '@shared/types'
import { todayISO } from '@shared/money'
import { FormDialog, type FieldDef, type Values } from '@/components/shared/FormDialog'
import { useSettings } from '@/hooks/useSettings'
import { api, mutate } from '@/lib/api'

export const MEASUREMENT_LABELS: Record<(typeof MEASUREMENT_FIELDS)[number], string> = {
  chest: 'Chest', waist: 'Waist', hip: 'Hip', shoulder: 'Shoulder', sleeveLength: 'Sleeve length', sleeveRound: 'Sleeve round', neck: 'Neck', garmentLength: 'Garment length', inseam: 'Inseam'
}
const num = (s: string) => (s.trim() === '' ? null : Number(s))

/** S5 Add / Edit Measurements. `prefill` = "Copy From Last Measurement" (ME-5). Old records are never overwritten (ME-1). */
export function MeasurementFormDialog({ clientId, edit, prefill, onClose }: { clientId: ID; edit?: Measurement; prefill?: Measurement; onClose: () => void }) {
  const { settings } = useSettings(), unit = settings.measurementUnit === 'in' ? 'inches' : 'cm'
  const src = edit ?? prefill
  const fields: FieldDef[] = [
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'garmentType', label: 'Garment type (optional)', type: 'select', options: ['', 'Blouse', 'Kurta', 'Pant', 'Suit'] },
    ...MEASUREMENT_FIELDS.map((k): FieldDef => ({ name: k, label: `${MEASUREMENT_LABELS[k]} (${unit})`, type: 'number' })),
    { name: 'notes', label: 'Notes', type: 'textarea', voice: true }
  ]
  const initial: Values = { date: edit?.date ?? todayISO(), garmentType: src?.garmentType ?? '', notes: edit?.notes ?? '' }
  MEASUREMENT_FIELDS.forEach((k) => { initial[k] = src?.[k] != null ? String(src[k]) : '' })
  return (
    <FormDialog title={edit ? 'Edit Measurements' : 'Add Measurements'} saveLabel="Save Measurements" savedMessage="Measurements saved" fields={fields} initial={initial} onClose={onClose}
      onSave={async (v) => {
        const i = { date: v.date, garmentType: v.garmentType, notes: v.notes } as MeasurementInput
        MEASUREMENT_FIELDS.forEach((k) => { i[k] = num(v[k]) })
        await mutate(edit ? api.measurements.update(edit.id, i) : api.measurements.create(clientId, i))
      }} />
  )
}
