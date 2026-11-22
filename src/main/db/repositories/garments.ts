import type { Garment, GarmentInput, GarmentStatus, ID } from '@shared/types'
import { deletePhotoFiles, isSafeName } from '../../services/photos'
import { all, assertBillSane, insertId, one, optionalDate, requireDate, requireText, run, tx, userError, wholeMoney } from '../util'

export interface GarmentRow {
  id: number; client_id: number; bill_id: number | null; description: string; date_ordered: string
  delivery_date: string | null; price: number; status: GarmentStatus; notes: string
}

/** Turns rows into Garment objects, loading all their photo file names in one query. */
export function hydrate(rows: GarmentRow[]): Garment[] {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const photos = all<{ garment_id: number; file_name: string }>(
    `SELECT garment_id, file_name FROM garment_photos WHERE garment_id IN (${ids.map(() => '?').join(',')}) ORDER BY position, id`, ...ids
  )
  return rows.map((r) => ({
    id: r.id, clientId: r.client_id, billId: r.bill_id, description: r.description, dateOrdered: r.date_ordered,
    deliveryDate: r.delivery_date, price: r.price, status: r.status, notes: r.notes,
    photos: photos.filter((p) => p.garment_id === r.id).map((p) => p.file_name)
  }))
}

const STATUSES = ['In Progress', 'Ready', 'Delivered']

function clean(i: GarmentInput) {
  const status = i?.status
  if (!STATUSES.includes(status)) throw userError('Please choose a status.')
  const photos = Array.isArray(i.photos) ? i.photos : []
  if (!photos.every((f) => typeof f === 'string' && isSafeName(f))) throw userError('One of the photos is not valid. Please add it again.')
  return {
    description: requireText(i.description, 'Please enter what the garment is'),
    dateOrdered: requireDate(i.dateOrdered),
    deliveryDate: optionalDate(i.deliveryDate),
    price: wholeMoney(i.price ?? 0, 0),
    status, notes: typeof i.notes === 'string' ? i.notes : '', photos
  }
}

const getRow = (id: number) => one<GarmentRow>('SELECT * FROM garments WHERE id = ?', id)
const get = (id: number): Garment => hydrate([getRow(id)!])[0]
const photoFiles = (id: number) => all<{ file_name: string }>('SELECT file_name FROM garment_photos WHERE garment_id = ?', id).map((r) => r.file_name)

function savePhotos(garmentId: number, files: string[]) {
  run('DELETE FROM garment_photos WHERE garment_id = ?', garmentId)
  files.forEach((f, n) => run('INSERT INTO garment_photos (garment_id, file_name, position) VALUES (?, ?, ?)', garmentId, f, n))
}

function listByClient(clientId: ID): Garment[] {
  return hydrate(all<GarmentRow>('SELECT * FROM garments WHERE client_id = ? ORDER BY date_ordered DESC, id DESC', clientId))
}

function create(clientId: ID, i: GarmentInput): Garment {
  const g = clean(i)
  if (!one('SELECT 1 FROM clients WHERE id = ?', clientId)) throw userError('This client no longer exists.')
  const id = tx(() => {
    const gid = insertId(
      'INSERT INTO garments (client_id, description, date_ordered, delivery_date, price, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      clientId, g.description, g.dateOrdered, g.deliveryDate, g.price, g.status, g.notes
    )
    savePhotos(gid, g.photos)
    return gid
  })
  return get(id)
}

function update(id: ID, i: GarmentInput): Garment {
  const g = clean(i)
  const cur = getRow(id)
  if (!cur) throw userError('This garment no longer exists.')
  const before = photoFiles(id)
  tx(() => {
    run('UPDATE garments SET description = ?, date_ordered = ?, delivery_date = ?, price = ?, status = ?, notes = ? WHERE id = ?',
      g.description, g.dateOrdered, g.deliveryDate, g.price, g.status, g.notes, id)
    savePhotos(id, g.photos)
    if (cur.bill_id) assertBillSane(cur.bill_id) // a price change must not push the bill below what was paid
  })
  deletePhotoFiles(before.filter((f) => !g.photos.includes(f)))
  return get(id)
}

/** GA-6: also deletes the photo files. */
function remove(id: ID): void {
  const cur = getRow(id)
  if (!cur) return
  const files = photoFiles(id)
  tx(() => {
    run('DELETE FROM garments WHERE id = ?', id)
    if (cur.bill_id) assertBillSane(cur.bill_id)
  })
  deletePhotoFiles(files)
}

export const garments = { listByClient, create, update, remove }
