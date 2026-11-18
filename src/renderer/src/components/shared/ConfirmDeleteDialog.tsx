import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { friendly } from '@/lib/api'
import { useToast } from './Toast'

/** UI-5: plain-language confirmation naming the thing, with "Yes, Delete" / "No, Keep It". */
export function ConfirmDeleteDialog({ title, message, onConfirm, onClose, doneMessage = 'Deleted' }: { title: string; message: ReactNode; onConfirm: () => Promise<void>; onClose: () => void; doneMessage?: string }) {
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const toast = useToast()
  const yes = async () => {
    setBusy(true)
    try { await onConfirm(); toast(doneMessage); onClose() } catch (e) { setErr(friendly(e)); setBusy(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={title}>
        <div className="mb-4">{message}</div>
        {err && <p className="mb-3 text-danger">{err}</p>}
        <div className="flex gap-3"><Button variant="destructive" disabled={busy} onClick={yes}>Yes, Delete</Button><Button onClick={onClose}>No, Keep It</Button></div>
      </DialogContent>
    </Dialog>
  )
}
