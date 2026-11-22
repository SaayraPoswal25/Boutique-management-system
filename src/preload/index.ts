import { contextBridge, ipcRenderer } from 'electron'
import { API_METHODS } from '../shared/ipc-channels'
import type { Api } from './index.d' // the contract

const api: Record<string, Record<string, (...args: unknown[]) => unknown>> = {}
for (const [ns, methods] of Object.entries(API_METHODS)) {
  api[ns] = {}
  for (const m of methods) api[ns][m] = (...args) => ipcRenderer.invoke(`${ns}:${m}`, ...args)
}
// Synchronous on purpose (it is used directly in <img src>). Served by the photo:// protocol in main.
api.photos.url = (file) => `photo://local/${encodeURIComponent(String(file))}`

contextBridge.exposeInMainWorld('api', api as unknown as Api)
