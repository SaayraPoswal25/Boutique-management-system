import { getDb } from './connection'

/** Messages starting with "USER:" are the only ones the UI shows (see lib/api.ts friendly()). */
export const userError = (message: string): Error => new Error('USER: ' + message)

export const all = <T>(sql: string, ...p: unknown[]): T[] => getDb().prepare(sql).all(...p) as T[]
export const one = <T>(sql: string, ...p: unknown[]): T | undefined => getDb().prepare(sql).get(...p) as T | undefined
export const run = (sql: string, ...p: unknown[]) => getDb().prepare(sql).run(...p)
export const insertId = (sql: string, ...p: unknown[]): number => Number(run(sql, ...p).lastInsertRowid)
export const tx = <T>(fn: () => T): T => getDb().transaction(fn)()

export const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
export function requireText(v: unknown, message: string): string {
  const t = text(v)
  if (!t) throw userError(message)
  return t
}
export function requireDate(v: unknown, message = 'Please choose a date'): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw userError(message)
  return v
}
export const optionalDate = (v: unknown): string | null => (v === null || v === undefined || v === '' ? null : requireDate(v, 'That date is not valid'))

/** Money is whole rupees (BR-1). min 1 = "above zero", min 0 = "zero or more". */
export function wholeMoney(v: unknown, min: 0 | 1): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw userError('Please enter a whole number of rupees (no paise).')
  if (n < min) throw userError(min === 1 ? 'Please enter an amount above zero' : 'The amount cannot be below zero')
  return n
}

export const digitsOf = (s: string): string => s.replace(/\D/g, '')
/** Searchable form of a phone number: digits only, without a +91 or 0 prefix (CL-5). */
export function phoneKey(s: string): string {
  let d = digitsOf(s)
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return d
}
/** LIKE pattern for "contains", escaping % _ and \ (use with ESCAPE '\'). */
export const likeAny = (s: string): string => '%' + s.replace(/[\\%_]/g, (c) => '\\' + c) + '%'

/** Called inside a transaction after any change to a bill's garments, discount or payments.
 *  Throwing rolls the whole change back. */
export function assertBillSane(billId: number): void {
  const r = one<{ total: number; paid: number }>('SELECT total, paid FROM bill_totals WHERE bill_id = ?', billId)
  if (!r) return
  if (r.total < 0) throw userError('The discount is more than the total.')
  if (r.paid > r.total) throw userError('The money already received is more than the new total. Please edit or delete a payment first.')
}

export const monthRange = (year: number, month: number): [string, string] => {
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  const next = month === 12 ? [year + 1, 1] : [year, month + 1]
  return [`${p(year, 4)}-${p(month)}-01`, `${p(next[0], 4)}-${p(next[1])}-01`]
}
