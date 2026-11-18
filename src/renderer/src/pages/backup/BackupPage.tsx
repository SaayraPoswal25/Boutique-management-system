import { useState } from 'react'
import { formatDate } from '@shared/money'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/shared/Toast'
import { useSettings } from '@/hooks/useSettings'
import { api, friendly } from '@/lib/api'
import { ui } from '@/lib/utils'

/** S22 Backup and Restore. Restore warns first; the main process makes a safety copy (BK-3). */
export default function BackupPage() {
  const { settings, update } = useSettings(), toast = useToast()
  const [confirm, setConfirm] = useState(false), [err, setErr] = useState('')
  const run = async (f: () => Promise<void>) => { setErr(''); try { await f() } catch (e) { setErr(friendly(e)) } }
  return (
    <div>
      <h1 className={ui.h1}>Backup</h1>
      <p className="my-3 text-lg">Last backup: <b>{settings.lastBackupAt ? formatDate(settings.lastBackupAt.slice(0, 10)) : 'Never'}</b></p>
      <p className="mb-4 text-muted-foreground">Backup folder: {settings.backupLocation || 'Not chosen yet'}</p>
      {err && <p className="mb-3 text-danger">{err}</p>}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={() => run(async () => { const at = await api.backup.now(); await update({ lastBackupAt: at }); toast('Backup saved') })}>Back Up My Data</Button>
        <Button onClick={() => run(async () => { const f = await api.backup.chooseFolder(); if (f) await update({ backupLocation: f }) })}>Choose Backup Folder</Button>
        <Button variant="dangerOutline" onClick={() => setConfirm(true)}>Restore From Backup</Button>
      </div>
      {confirm && (
        <Dialog open onOpenChange={(o) => !o && setConfirm(false)}>
          <DialogContent title="Restore from a backup?">
            <p className="mb-4">Your current data will be replaced by the backup you choose. We will first save a safety copy of what you have now.</p>
            <div className="flex gap-3"><Button variant="destructive" onClick={() => { setConfirm(false); run(async () => { await api.backup.restore() }) }}>Yes, Restore</Button><Button onClick={() => setConfirm(false)}>No, Keep My Data</Button></div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
