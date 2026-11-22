/** Every method the renderer is allowed to call (the IPC whitelist).
 *  - preload/index.ts builds window.api from this list.
 *  - main/ipc/index.ts refuses to start if a listed method has no handler. */
export const API_METHODS = {
  clients: ['list', 'get', 'findByPhone', 'create', 'update', 'deletePreview', 'remove'],
  measurements: ['listByClient', 'create', 'update', 'remove'],
  garments: ['listByClient', 'create', 'update', 'remove'],
  photos: ['pick'], // photos.url is built in the preload, it needs no IPC
  bills: ['list', 'get', 'pending', 'create', 'update', 'remove'],
  payments: ['create', 'update', 'remove'],
  employees: ['list', 'get', 'create', 'update', 'setActive', 'remove', 'monthSummary', 'entries', 'addEntry', 'updateEntry', 'removeEntry'],
  earnings: ['year', 'allYears', 'month'],
  settings: ['get', 'set'],
  backup: ['now', 'restore', 'chooseFolder'],
  voice: ['ready', 'transcribe']
} as const
