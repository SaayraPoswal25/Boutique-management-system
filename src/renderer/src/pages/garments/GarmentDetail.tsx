import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@shared/money'
import type { Garment } from '@shared/types'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { MoneyText } from '@/components/shared/MoneyText'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { api, mutate } from '@/lib/api'
import { GarmentFormDialog } from './GarmentForm'
import { GarmentPhoto } from './GarmentPhoto'

/** S8 Garment Detail / large photo viewer (GA-3). */
export function GarmentDetail({ garment, onClose }: { garment: Garment; onClose: () => void }) {
  const [editing, setEditing] = useState(false), [deleting, setDeleting] = useState(false), nav = useNavigate()
  if (editing) return <GarmentFormDialog clientId={garment.clientId} garment={garment} onClose={() => { setEditing(false); onClose() }} />
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={garment.description}>
        {garment.photos.map((f) => <GarmentPhoto key={f} file={f} className="mb-3 max-h-80 w-full" />)}
        <p>Ordered {formatDate(garment.dateOrdered)}{garment.deliveryDate ? `, delivery ${formatDate(garment.deliveryDate)}` : ''}</p>
        <p>Price <MoneyText amount={garment.price} /> · {garment.status}</p>
        {garment.notes && <p className="mt-2">{garment.notes}</p>}
        <p className="my-3">{garment.billId ? <Button onClick={() => nav(`/bills/${garment.billId}`)}>Open Bill</Button> : <span className="text-muted-foreground">Not billed yet</span>}</p>
        <div className="flex flex-wrap gap-3"><Button variant="primary" onClick={() => setEditing(true)}>Edit Garment</Button><Button variant="dangerOutline" onClick={() => setDeleting(true)}>Delete Garment</Button><Button onClick={onClose}>Close</Button></div>
        {deleting && <ConfirmDeleteDialog title="Delete this garment?" message={`"${garment.description}" and its photos will be deleted.`} onConfirm={() => mutate(api.garments.remove(garment.id))} onClose={() => { setDeleting(false); onClose() }} />}
      </DialogContent>
    </Dialog>
  )
}
