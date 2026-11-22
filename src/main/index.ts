import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { app, BrowserWindow, dialog, protocol, session } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { closeDb, openDb } from './db/connection'
import { registerIpc } from './ipc'
import { autoBackupOnQuit } from './services/backup'
import { cleanOrphanPhotos, registerPhotoProtocol } from './services/photos'

// Fixed data folder (the dev build gets its own, so testing never touches real data).
app.setPath('userData', join(app.getPath('appData'), is.dev ? 'Boutique Client Manager (dev)' : 'Boutique Client Manager'))
// Must run before the app is ready: lets <img src="photo://..."> load garment photos.
protocol.registerSchemesAsPrivileged([{ scheme: 'photo', privileges: { standard: true, secure: true, supportFetchAPI: true } }])

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 1000, minHeight: 640,
    show: false, autoHideMenuBar: true, title: 'Boutique Client Manager',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: { preload: join(__dirname, '../preload/index.js'), sandbox: false, contextIsolation: true, nodeIntegration: false }
  })
  win.on('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' })) // fully offline: nothing opens outside the app
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  else win.loadFile(join(__dirname, '../renderer/index.html'))
}

// PL-7: only one copy at a time, so two copies can never fight over the database.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const w = BrowserWindow.getAllWindows()[0]
    if (w) { if (w.isMinimized()) w.restore(); w.focus() }
  })

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('com.boutique.manager')
    app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

    try {
      openDb()
    } catch (e) {
      const newer = e instanceof Error && e.message === 'NEWER_DATA'
      console.error('[startup]', e)
      dialog.showErrorBox(
        'Boutique Client Manager',
        newer
          ? 'Your data was saved by a newer version of this app. Please install the latest version.'
          : 'The app could not open its data file. Please close the app and try again. If this keeps happening, restore a backup.'
      )
      app.exit(1)
      return
    }

    registerPhotoProtocol()
    registerIpc()
    cleanOrphanPhotos()

    // Microphone only (voice notes); every other permission request is refused.
    session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => cb(permission === 'media'))
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => permission === 'media')

    createWindow()
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
  })

  app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })

  let closing = false
  app.on('before-quit', () => {
    if (closing) return
    closing = true
    autoBackupOnQuit() // BK-2
    closeDb()
  })
}
