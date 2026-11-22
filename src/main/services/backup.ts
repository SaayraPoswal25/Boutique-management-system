import Database from 'better-sqlite3'
import { BrowserWindow, dialog, type OpenDialogOptions } from 'electron'
import { format } from 'date-fns'
import { cpSync, copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { closeDb, getDb, openDb } from '../db/connection'
import { LATEST_VERSION } from '../db/migrate'
import { getSettings, setSettings } from '../db/repositories/settings'
import { userError } from '../db/util'
import { backupsDir, dbPath, photosDir, safetyDir } from '../paths'
import { cleanOrphanPhotos } from './photos'

const PREFIX = 'boutique-backup-'
const KEEP_BACKUPS = 10 // BK-2
const KEEP_SAFETY = 5
const stamp = (): string => format(new Date(), 'yyyy-MM-dd_HHmmss-SSS')

/** A consistent copy of the database (VACUUM INTO is safe while the app is running and with WAL)
 *  plus the photos folder. */
function snapshotTo(dir: string): void {
  mkdirSync(dir, { recursive: true })
  getDb().exec(`VACUUM INTO '${join(dir, 'boutique.db').replace(/'/g, "''")}'`)
  if (existsSync(photosDir())) cpSync(photosDir(), join(dir, 'garment-photos'), { recursive: true })
}

function prune(root: string, prefix: string, keep: number): void {
  try {
    const old = readdirSync(root).filter((n) => n.startsWith(prefix)).sort().reverse().slice(keep)
    for (const n of old) rmSync(join(root, n), { recursive: true, force: true })
  } catch { /* best effort */ }
}

/** BK-1. Returns a local timestamp like 2026-11-21T18:30:00 (no "Z"), so slice(0, 10) is the local date. */
export function backupNow(): string {
  const root = getSettings().backupLocation || backupsDir()
  try {
    snapshotTo(join(root, PREFIX + stamp()))
  } catch (e) {
    console.error('[backup]', e)
    throw userError("We couldn't save the backup. Please check that the backup folder is available and try again.")
  }
  prune(root, PREFIX, KEEP_BACKUPS)
  const at = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
  setSettings({ lastBackupAt: at })
  return at
}

/** BK-2: runs when the app closes. Never blocks quitting if it fails. */
export function autoBackupOnQuit(): void {
  try { if (getSettings().autoBackup) backupNow() } catch { /* ignore */ }
}

export async function chooseFolder(): Promise<string | null> {
  const opts: OpenDialogOptions = { title: 'Choose where to keep your backups', properties: ['openDirectory', 'createDirectory'] }
  const win = BrowserWindow.getFocusedWindow()
  const r = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts)
  return r.canceled || !r.filePaths[0] ? null : r.filePaths[0]
}

/** BK-3: pick a backup folder, save a safety copy of the current data, then replace the data. */
export async function restoreBackup(): Promise<boolean> {
  const opts: OpenDialogOptions = {
    title: 'Choose the backup folder to restore from', properties: ['openDirectory'],
    defaultPath: getSettings().backupLocation || backupsDir()
  }
  const win = BrowserWindow.getFocusedWindow()
  const r = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts)
  if (r.canceled || !r.filePaths[0]) return false
  const src = r.filePaths[0]
  const srcDb = join(src, 'boutique.db')
  const notABackup = userError('That folder does not look like a backup. Please choose a folder whose name starts with "boutique-backup-".')
  if (!existsSync(srcDb)) throw notABackup
  // Never "restore" from the live data folder itself: source and destination would be the same files.
  if (resolve(src) === resolve(dirname(dbPath()))) throw userError('That is the folder the app is using right now. Please choose one of your backup folders instead.')

  // Check the backup is a healthy database that this version of the app understands, BEFORE touching anything.
  try {
    const t = new Database(srcDb, { readonly: true })
    try {
      if ((t.pragma('quick_check', { simple: true }) as string) !== 'ok') throw notABackup
      if ((t.pragma('user_version', { simple: true }) as number) > LATEST_VERSION) throw userError('That backup was made by a newer version of the app.')
    } finally { t.close() }
  } catch (e) {
    throw e instanceof Error && e.message.startsWith('USER:') ? e : notABackup
  }

  snapshotTo(join(safetyDir(), 'before-restore-' + stamp()))
  prune(safetyDir(), 'before-restore-', KEEP_SAFETY)

  // Stage EVERYTHING first (database and photos). If any copy fails, the live data has not been touched.
  const stagedDb = dbPath() + '.restoring'
  const stagedPhotos = photosDir() + '.restoring'
  try {
    rmSync(stagedDb, { force: true })
    rmSync(stagedPhotos, { recursive: true, force: true })
    copyFileSync(srcDb, stagedDb)
    mkdirSync(stagedPhotos, { recursive: true })
    if (existsSync(join(src, 'garment-photos'))) cpSync(join(src, 'garment-photos'), stagedPhotos, { recursive: true })
  } catch (e) {
    console.error('[restore]', e)
    rmSync(stagedDb, { force: true })
    rmSync(stagedPhotos, { recursive: true, force: true })
    throw userError("We couldn't read that backup, so nothing was changed. Please check the folder and try again.")
  }

  // Swap in the staged copies (quick renames), then reopen.
  closeDb()
  try {
    rmSync(dbPath() + '-wal', { force: true })
    rmSync(dbPath() + '-shm', { force: true })
    renameSync(stagedDb, dbPath())
    rmSync(photosDir(), { recursive: true, force: true })
    renameSync(stagedPhotos, photosDir())
  } finally {
    openDb() // runs any newer migrations on an older backup
    cleanOrphanPhotos()
  }
  win?.webContents.reload()
  return true
}
