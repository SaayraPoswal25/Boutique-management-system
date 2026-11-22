import { app } from 'electron'
import { join } from 'path'

// Everything lives in the user-data folder, never in the install folder,
// so reinstalling or updating the app can't touch the data.
export const dbPath = (): string => join(app.getPath('userData'), 'boutique.db')
export const photosDir = (): string => join(app.getPath('userData'), 'garment-photos')
export const backupsDir = (): string => join(app.getPath('userData'), 'backups')
export const safetyDir = (): string => join(app.getPath('userData'), 'safety-copies')
