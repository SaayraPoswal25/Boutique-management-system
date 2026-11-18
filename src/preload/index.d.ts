import type * as T from '../shared/types'

/** The ONLY thing the renderer can call. Main-process handlers must match this shape.
 *  Handlers reject with Error('USER: plain message') for messages that are safe to show. */
export interface Api {
  clients: {
    list(query: string): Promise<T.Client[]>
    get(id: T.ID): Promise<T.Client | null>
    findByPhone(phone: string): Promise<T.Client | null>
    create(i: T.ClientInput): Promise<T.Client>
    update(id: T.ID, i: T.ClientInput): Promise<T.Client>
    deletePreview(id: T.ID): Promise<T.DeletePreview>
    remove(id: T.ID): Promise<void>
  }
  measurements: {
    listByClient(clientId: T.ID): Promise<T.Measurement[]>
    create(clientId: T.ID, i: T.MeasurementInput): Promise<T.Measurement>
    update(id: T.ID, i: T.MeasurementInput): Promise<T.Measurement>
    remove(id: T.ID): Promise<void>
  }
  garments: {
    listByClient(clientId: T.ID): Promise<T.Garment[]>
    create(clientId: T.ID, i: T.GarmentInput): Promise<T.Garment>
    update(id: T.ID, i: T.GarmentInput): Promise<T.Garment>
    remove(id: T.ID): Promise<void> // also deletes photo files
  }
  photos: {
    pick(): Promise<string | null> // opens file dialog, copies into photos dir, returns file name
    url(file: string): string // e.g. photo://<file>
  }
  bills: {
    list(f: { status?: T.BillStatus; clientId?: T.ID; search?: string }): Promise<T.Bill[]>
    get(id: T.ID): Promise<T.BillDetail | null>
    pending(): Promise<T.PendingBill[]>
    create(i: T.BillInput): Promise<T.Bill>
    update(id: T.ID, i: T.BillInput): Promise<T.Bill>
    remove(id: T.ID): Promise<void>
  }
  payments: {
    create(billId: T.ID, i: T.PaymentInput): Promise<T.Payment>
    update(id: T.ID, i: T.PaymentInput): Promise<T.Payment>
    remove(id: T.ID): Promise<void>
  }
  employees: {
    list(activeOnly: boolean): Promise<T.Employee[]>
    get(id: T.ID): Promise<T.Employee | null>
    create(i: T.EmployeeInput): Promise<T.Employee>
    update(id: T.ID, i: T.EmployeeInput): Promise<T.Employee>
    setActive(id: T.ID, active: boolean): Promise<void>
    remove(id: T.ID): Promise<void>
    monthSummary(id: T.ID): Promise<T.EmployeeMonth>
    entries(id: T.ID, kind: T.EntryKind, from?: string, to?: string): Promise<T.Entry[]>
    addEntry(id: T.ID, kind: T.EntryKind, i: T.EntryInput): Promise<T.Entry>
    updateEntry(kind: T.EntryKind, entryId: T.ID, i: T.EntryInput): Promise<T.Entry>
    removeEntry(kind: T.EntryKind, entryId: T.ID): Promise<void>
  }
  earnings: {
    year(year: number): Promise<T.MonthEarnings[]>
    allYears(): Promise<T.YearTotal[]>
    month(year: number, month: number): Promise<T.MonthDetail>
  }
  settings: { get(): Promise<T.Settings>; set(p: Partial<T.Settings>): Promise<T.Settings> }
  backup: {
    now(): Promise<string> // returns ISO timestamp
    restore(): Promise<boolean> // main: pick folder, safety copy, replace data, reload window
    chooseFolder(): Promise<string | null>
  }
  voice: {
    ready(): Promise<boolean> // true once the speech model is loaded
    transcribe(pcm16k: Float32Array): Promise<string> // fully on-device
  }
}
declare global { interface Window { api: Api } }
