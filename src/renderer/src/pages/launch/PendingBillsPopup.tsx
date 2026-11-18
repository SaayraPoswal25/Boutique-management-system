import { differenceInCalendarDays, parseISO } from 'date-fns'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { usePendingBills } from '@/hooks/usePendingBills'
import { useMoney, useSettings } from '@/hooks/useSettings'

/** S1: shown once at launch when bills are pending and/or no backup in 7 days (NO-3, BK-4). */
export function PendingBillsPopup() {
  const [open, setOpen] = useState(true), nav = useNavigate(), money = useMoney()
  const { count, total, loaded } = usePendingBills(), { settings } = useSettings()
  const backupDue = !settings.lastBackupAt || differenceInCalendarDays(new Date(), parseISO(settings.lastBackupAt)) >= 7
  if (!open || !loaded || (count === 0 && !backupDue)) return null
  const go = (to: string) => { setOpen(false); nav(to) }
  return (
    <Dialog open onOpenChange={(o) => !o && setOpen(false)}>
      <DialogContent title="Before you start">
        {count > 0 && <p className="mb-3 text-lg">You have {count} pending {count === 1 ? 'bill' : 'bills'} totalling {money(total)}</p>}
        {backupDue && <p className="mb-3 text-lg">You have not backed up your data in the last 7 days.</p>}
        <div className="flex flex-wrap gap-3">
          {count > 0 && <Button variant="primary" onClick={() => go('/pending')}>View Pending Bills</Button>}
          {backupDue && <Button variant={count > 0 ? 'outline' : 'primary'} onClick={() => go('/backup')}>Back Up My Data</Button>}
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
