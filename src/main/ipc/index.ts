import { ipcMain } from 'electron'
import { API_METHODS } from '../../shared/ipc-channels'
import { bills, payments } from '../db/repositories/bills'
import { clients } from '../db/repositories/clients'
import { earnings } from '../db/repositories/earnings'
import { employees } from '../db/repositories/employees'
import { garments } from '../db/repositories/garments'
import { measurements } from '../db/repositories/measurements'
import { settings } from '../db/repositories/settings'
import { backupNow, chooseFolder, restoreBackup } from '../services/backup'
import { pickPhoto } from '../services/photos'
import { voice } from '../services/voice'
import type { Api } from '../../preload/index.d' // the contract

// Same shape as Api, but handlers may be synchronous. photos.url has no handler (preload builds it).
type Sync<T> = { [K in keyof T]: T[K] extends (...a: infer A) => Promise<infer R> ? (...a: A) => R | Promise<R> : T[K] }
type Handlers = { [N in keyof Api]: Sync<N extends 'photos' ? Pick<Api['photos'], 'pick'> : Api[N]> }

const handlers: Handlers = {
  clients, measurements, garments, bills, payments, employees, earnings, settings, voice,
  photos: { pick: pickPhoto },
  backup: { now: backupNow, restore: restoreBackup, chooseFolder }
}

/** Registers every method in API_METHODS. Errors starting with "USER:" reach the UI as written;
 *  anything else is logged and the UI only sees a generic message. */
export function registerIpc(): void {
  for (const [ns, methods] of Object.entries(API_METHODS)) {
    for (const m of methods) {
      const fn = ((handlers as unknown as Record<string, Record<string, unknown>>)[ns] ?? {})[m]
      if (typeof fn !== 'function') throw new Error(`No handler for ${ns}.${m}`)
      ipcMain.handle(`${ns}:${m}`, async (_e, ...args: unknown[]) => {
        try {
          return await (fn as (...a: unknown[]) => unknown)(...args)
        } catch (e) {
          if (e instanceof Error && e.message.startsWith('USER:')) throw e
          console.error(`[${ns}.${m}]`, e)
          throw new Error('Something went wrong')
        }
      })
    }
  }
}
