import { MEASUREMENT_FIELDS, type ID, type Measurement, type MeasurementInput } from '@shared/types'
import { all, insertId, one, requireDate, run, text, userError } from '../util'

const snake = (s: string): string => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
const COLS = MEASUREMENT_FIELDS.map(snake)
type Row = Record<string, unknown> & { id: number; client_id: number; date: string; garment_type: string; notes: string }

function toM(r: Row): Measurement {
  const m: Record<string, unknown> = { id: r.id, clientId: r.client_id, date: r.date, garmentType: r.garment_type, notes: r.notes }
  MEASUREMENT_FIELDS.forEach((k) => { m[k] = r[snake(k)] ?? null })
  return m as unknown as Measurement
}

function clean(i: MeasurementInput) {
  const date = requireDate(i?.date)
  const values = MEASUREMENT_FIELDS.map((k) => {
    const v = i[k]
    if (v === null || v === undefined) return null
    const n = Number(v)
    if (!Number.isFinite(n) || n < 0) throw userError('Measurements must be numbers, zero or above.')
    return n
  })
  return { date, garmentType: text(i.garmentType), notes: typeof i.notes === 'string' ? i.notes : '', values }
}

const get = (id: ID): Measurement => toM(one<Row>('SELECT * FROM measurements WHERE id = ?', id)!)

// ME-1: records are only ever added; the newest comes first.
function listByClient(clientId: ID): Measurement[] {
  return all<Row>('SELECT * FROM measurements WHERE client_id = ? ORDER BY date DESC, id DESC', clientId).map(toM)
}

function create(clientId: ID, i: MeasurementInput): Measurement {
  const c = clean(i)
  if (!one('SELECT 1 FROM clients WHERE id = ?', clientId)) throw userError('This client no longer exists.')
  const id = insertId(
    `INSERT INTO measurements (client_id, date, garment_type, notes, ${COLS.join(', ')}) VALUES (?, ?, ?, ?, ${COLS.map(() => '?').join(', ')})`,
    clientId, c.date, c.garmentType, c.notes, ...c.values
  )
  return get(id)
}

function update(id: ID, i: MeasurementInput): Measurement {
  const c = clean(i)
  if (!one('SELECT 1 FROM measurements WHERE id = ?', id)) throw userError('This measurement no longer exists.')
  run(`UPDATE measurements SET date = ?, garment_type = ?, notes = ?, ${COLS.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`, c.date, c.garmentType, c.notes, ...c.values, id)
  return get(id)
}

const remove = (id: ID): void => { run('DELETE FROM measurements WHERE id = ?', id) }

export const measurements = { listByClient, create, update, remove }
