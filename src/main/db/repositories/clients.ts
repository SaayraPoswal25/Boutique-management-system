import type { Client, ClientInput, DeletePreview, ID } from '@shared/types'
import { deletePhotoFiles } from '../../services/photos'
import { all, digitsOf, insertId, likeAny, one, phoneKey, requireText, run, text, tx, userError } from '../util'

// pendingAmount is computed once for all clients (grouped join), not once per client row.
const SELECT = `
SELECT c.id, c.name, c.phone, c.notes,
       COALESCE(p.pending, 0) AS pendingAmount,
       (SELECT MAX(d) FROM (
          SELECT date AS d FROM bills WHERE client_id = c.id
          UNION ALL SELECT date_ordered FROM garments WHERE client_id = c.id
          UNION ALL SELECT date FROM measurements WHERE client_id = c.id)) AS lastVisit
FROM clients c
LEFT JOIN (SELECT client_id, SUM(CASE WHEN total - paid > 0 THEN total - paid ELSE 0 END) AS pending
           FROM bill_totals GROUP BY client_id) p ON p.client_id = c.id`

function clean(i: ClientInput) {
  const name = requireText(i?.name, 'Please enter a name')
  const phone = requireText(i?.phone, 'Please enter a phone number')
  return { name, phone, notes: typeof i.notes === 'string' ? i.notes : '', key: phoneKey(phone) }
}

function get(id: ID): Client | null {
  return one<Client>(`${SELECT} WHERE c.id = ?`, id) ?? null
}

/** SE-2: name (partial, any case) or phone (partial, ignoring spaces, dashes and +91). */
function list(query: string): Client[] {
  const q = text(query)
  if (!q) return all<Client>(`${SELECT} ORDER BY c.name COLLATE NOCASE, c.id`)
  const where = ["c.name LIKE ? ESCAPE '\\'"]
  const params: unknown[] = [likeAny(q)]
  const d = digitsOf(q)
  if (d) {
    where.push("c.phone_clean LIKE ? ESCAPE '\\'")
    params.push(likeAny(d))
    const k = phoneKey(q)
    if (k && k !== d) { where.push("c.phone_clean LIKE ? ESCAPE '\\'"); params.push(likeAny(k)) }
  }
  return all<Client>(`${SELECT} WHERE ${where.join(' OR ')} ORDER BY c.name COLLATE NOCASE, c.id`, ...params)
}

function findByPhone(phone: string): Client | null {
  const k = phoneKey(String(phone ?? ''))
  return k ? (one<Client>(`${SELECT} WHERE c.phone_clean = ? ORDER BY c.id`, k) ?? null) : null
}

function create(i: ClientInput): Client {
  const c = clean(i)
  const id = insertId('INSERT INTO clients (name, phone, phone_clean, notes) VALUES (?, ?, ?, ?)', c.name, c.phone, c.key, c.notes)
  return get(id)!
}

function update(id: ID, i: ClientInput): Client {
  const c = clean(i)
  if (!one('SELECT 1 FROM clients WHERE id = ?', id)) throw userError('This client no longer exists.')
  run('UPDATE clients SET name = ?, phone = ?, phone_clean = ?, notes = ? WHERE id = ?', c.name, c.phone, c.key, c.notes, id)
  return get(id)!
}

function deletePreview(id: ID): DeletePreview {
  const n = (sql: string) => one<{ n: number }>(sql, id)!.n
  return {
    measurements: n('SELECT COUNT(*) AS n FROM measurements WHERE client_id = ?'),
    garments: n('SELECT COUNT(*) AS n FROM garments WHERE client_id = ?'),
    bills: n('SELECT COUNT(*) AS n FROM bills WHERE client_id = ?')
  }
}

/** CL-3: everything belonging to the client goes (foreign keys cascade), including photo files. */
function remove(id: ID): void {
  const files = all<{ file_name: string }>('SELECT file_name FROM garment_photos WHERE garment_id IN (SELECT id FROM garments WHERE client_id = ?)', id).map((r) => r.file_name)
  tx(() => run('DELETE FROM clients WHERE id = ?', id))
  deletePhotoFiles(files)
}

export const clients = { list, get, findByPhone, create, update, deletePreview, remove }
