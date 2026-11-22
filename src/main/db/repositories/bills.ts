import { daysSince, formatRupees } from '@shared/money'
import type { Bill, BillDetail, BillInput, BillStatus, ID, Payment, PaymentInput, PendingBill } from '@shared/types'
import { all, assertBillSane, insertId, one, requireDate, run, text, tx, userError, wholeMoney, likeAny } from '../util'
import { hydrate, type GarmentRow } from './garments'
import { getSettings } from './settings'

type BillRow = Omit<Bill, 'status'>
const SELECT = `
SELECT t.bill_id AS id, t.client_id AS clientId, c.name AS clientName, c.phone AS clientPhone,
       t.date, t.discount, t.notes, t.total, t.paid, t.total - t.paid AS balance
FROM bill_totals t JOIN clients c ON c.id = t.client_id`

// BI-3: Paid / Pending is always calculated, never stored.
const toBill = (r: BillRow): Bill => ({ ...r, status: r.balance > 0 ? 'Pending' : 'Paid' })

export function queryBills(where = '', params: unknown[] = []): Bill[] {
  return all<BillRow>(`${SELECT} ${where ? 'WHERE ' + where : ''} ORDER BY t.date DESC, t.bill_id DESC`, ...params).map(toBill)
}
const billRow = (id: number): Bill => toBill(one<BillRow>(`${SELECT} WHERE t.bill_id = ?`, id)!)

function list(f: { status?: BillStatus; clientId?: ID; search?: string }): Bill[] {
  const w: string[] = []
  const p: unknown[] = []
  if (f?.status === 'Pending') w.push('t.total - t.paid > 0')
  if (f?.status === 'Paid') w.push('t.total - t.paid <= 0')
  if (f?.clientId) { w.push('t.client_id = ?'); p.push(f.clientId) }
  if (text(f?.search)) { w.push("c.name LIKE ? ESCAPE '\\'"); p.push(likeAny(text(f.search))) }
  return queryBills(w.join(' AND '), p)
}

const payRow = (r: { id: number; bill_id: number; date: string; amount: number; note: string }): Payment =>
  ({ id: r.id, billId: r.bill_id, date: r.date, amount: r.amount, note: r.note })

function get(id: ID): BillDetail | null {
  if (!one('SELECT 1 FROM bills WHERE id = ?', id)) return null
  const garments = hydrate(all<GarmentRow>('SELECT * FROM garments WHERE bill_id = ? ORDER BY date_ordered, id', id))
  const payments = all<{ id: number; bill_id: number; date: string; amount: number; note: string }>(
    'SELECT * FROM payments WHERE bill_id = ? ORDER BY date, id', id).map(payRow)
  return { ...billRow(id), garments, payments }
}

/** NO-2 / S13: unpaid bills, oldest first. */
function pending(): PendingBill[] {
  return queryBills('t.total - t.paid > 0')
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)
    .map((b) => ({ billId: b.id, clientId: b.clientId, clientName: b.clientName, clientPhone: b.clientPhone, date: b.date, balance: b.balance, ageDays: Math.max(0, daysSince(b.date)) }))
}

function checkInput(i: BillInput, billId?: number) {
  const date = requireDate(i?.date)
  const discount = wholeMoney(i.discount ?? 0, 0)
  const ids = [...new Set(Array.isArray(i.garmentIds) ? i.garmentIds : [])]
  if (!ids.length) throw userError('Please tick at least one garment')
  if (!one('SELECT 1 FROM clients WHERE id = ?', i.clientId)) throw userError('This client no longer exists.')
  for (const gid of ids) {
    const g = one<{ client_id: number; bill_id: number | null }>('SELECT client_id, bill_id FROM garments WHERE id = ?', gid)
    if (!g || g.client_id !== i.clientId || (g.bill_id !== null && g.bill_id !== billId)) throw userError('One of the garments is already on another bill.')
  }
  return { date, discount, ids, notes: typeof i.notes === 'string' ? i.notes : '' }
}
const link = (billId: number, ids: number[]) => ids.forEach((g) => run('UPDATE garments SET bill_id = ? WHERE id = ?', billId, g))

function create(i: BillInput): Bill {
  const b = checkInput(i)
  const id = tx(() => {
    const bid = insertId('INSERT INTO bills (client_id, date, discount, notes) VALUES (?, ?, ?, ?)', i.clientId, b.date, b.discount, b.notes)
    link(bid, b.ids)
    assertBillSane(bid) // e.g. discount bigger than the garments' total
    return bid
  })
  return billRow(id)
}

function update(id: ID, i: BillInput): Bill {
  const cur = one<{ client_id: number }>('SELECT client_id FROM bills WHERE id = ?', id)
  if (!cur) throw userError('This bill no longer exists.')
  if (cur.client_id !== i?.clientId) throw userError("A bill can't be moved to another client.")
  const b = checkInput(i, id)
  tx(() => {
    run('UPDATE bills SET date = ?, discount = ?, notes = ? WHERE id = ?', b.date, b.discount, b.notes, id)
    run('UPDATE garments SET bill_id = NULL WHERE bill_id = ?', id)
    link(id, b.ids)
    assertBillSane(id)
  })
  return billRow(id)
}

/** The bill and its payments go; its garments stay on the client (they become unbilled). */
const remove = (id: ID): void => { tx(() => run('DELETE FROM bills WHERE id = ?', id)) }

export const bills = { list, get, pending, create, update, remove }

// ---- payments ----
const fmt = (n: number) => formatRupees(n, getSettings().currencySymbol)
const payById = (id: number) => payRow(one('SELECT * FROM payments WHERE id = ?', id)!)

function checkPayment(i: PaymentInput) {
  return { date: requireDate(i?.date), amount: wholeMoney(i.amount, 1), note: typeof i.note === 'string' ? i.note : '' }
}
/** BI-4: a payment can never be more than what is still owed. `own` frees up the amount being edited. */
function assertWithinBalance(billId: number, amount: number, own = 0) {
  const b = one<{ total: number; paid: number }>('SELECT total, paid FROM bill_totals WHERE bill_id = ?', billId)
  if (!b) throw userError('This bill no longer exists.')
  const balance = b.total - b.paid + own
  if (amount > balance) throw userError(`This is more than the balance of ${fmt(balance)}.`)
}

function createPayment(billId: ID, i: PaymentInput): Payment {
  const p = checkPayment(i)
  const id = tx(() => {
    assertWithinBalance(billId, p.amount)
    return insertId('INSERT INTO payments (bill_id, date, amount, note) VALUES (?, ?, ?, ?)', billId, p.date, p.amount, p.note)
  })
  return payById(id)
}
function updatePayment(id: ID, i: PaymentInput): Payment {
  const p = checkPayment(i)
  tx(() => {
    const cur = one<{ bill_id: number; amount: number }>('SELECT bill_id, amount FROM payments WHERE id = ?', id)
    if (!cur) throw userError('This payment no longer exists.')
    assertWithinBalance(cur.bill_id, p.amount, cur.amount)
    run('UPDATE payments SET date = ?, amount = ?, note = ? WHERE id = ?', p.date, p.amount, p.note, id)
  })
  return payById(id)
}
const removePayment = (id: ID): void => { run('DELETE FROM payments WHERE id = ?', id) }

export const payments = { create: createPayment, update: updatePayment, remove: removePayment }
