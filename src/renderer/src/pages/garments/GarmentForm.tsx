import { useState } from 'react'
import { todayISO } from '@shared/money'
import type { Garment, GarmentStatus, ID } from '@shared/types'
import { FormDialog } from '@/components/shared/FormDialog'
import { Button } from '@/components/ui/button'
import { api, mutate } from '@/lib/api'
import { GarmentPhoto } from './GarmentPhoto'

/** S7 Add / Edit Garment. Photo is optional and only the file name is stored (GA-2). */
export function GarmentFormDialog({ clientId, garment, onClose }: { clientId: ID; garment?: Garment; onClose: () => void }) {
  const [photos, setPhotos] = useState<string[]>(garment?.photos ?? [])
  const add = async () => { const f = await api.photos.pick(); if (f) setPhotos((p) => [...p, f]) }
  const extra = (
    <div className="mb-4">
      <p className="mb-1 font-semibold">Photo (optional)</p>
      <div className="mb-2 flex flex-wrap gap-3">
        {photos.map((f) => (
          <div key={f} className="flex flex-col gap-1"><GarmentPhoto file={f} className="h-24 w-24" /><Button variant="dangerOutline" onClick={() => setPhotos((p) => p.filter((x) => x !== f))}>Remove Photo</Button></div>
        ))}
      </div>
      <Button onClick={add}>Add Photo</Button>
    </div>
  )
  return (
    <FormDialog title={garment ? 'Edit Garment' : 'Add Garment'} saveLabel="Save Garment" savedMessage="Garment saved" onClose={onClose} extra={extra}
      fields={[
        { name: 'description', label: 'Garment type or description', required: true },
        { name: 'dateOrdered', label: 'Date ordered', type: 'date', required: true },
        { name: 'deliveryDate', label: 'Delivery date (optional)', type: 'date' },
        { name: 'price', label: 'Price', type: 'number' },
        { name: 'status', label: 'Status', type: 'select', options: ['In Progress', 'Ready', 'Delivered'] },
        { name: 'notes', label: 'Notes', type: 'textarea', voice: true }
      ]}
      initial={{ description: garment?.description ?? '', dateOrdered: garment?.dateOrdered ?? todayISO(), deliveryDate: garment?.deliveryDate ?? '', price: String(garment?.price ?? ''), status: garment?.status ?? 'In Progress', notes: garment?.notes ?? '' }}
      onSave={async (v) => {
        const i = { description: v.description.trim(), dateOrdered: v.dateOrdered, deliveryDate: v.deliveryDate || null, price: Number(v.price) || 0, status: v.status as GarmentStatus, notes: v.notes, photos }
        await mutate(garment ? api.garments.update(garment.id, i) : api.garments.create(clientId, i))
      }} />
  )
}
