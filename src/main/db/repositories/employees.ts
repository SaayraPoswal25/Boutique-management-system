import type { Employee, EmployeeInput, EmployeeMonth, Entry, EntryInput, EntryKind, ID } from '@shared/types'
import { all, insertId, monthRange, one, optionalDate, requireDate, requireText, run, tx, userError, wholeMoney } from '../util'

// The three kinds of entry live in three tables. Table/column names come ONLY from this map, never from user input.
const KINDS = {
  work: { table: 'work_entries', amount: 'amount_earned', text: 'description' },
  advance: { table: 'advances', amount: 'amount', text: 'note' },
  payout: { table: 'payouts', amount: 'amount', text: 'note' }
} as const
function kindOf(k: EntryKind) {
  const c = (KINDS as Record<string, (typeof KINDS)[EntryKind]>)[k]
  if (!c) throw userError('Unknown entry type.')
  return c
}

// EM-6: balance owed = total earned - advances - payouts. Negative means the employee owes the shop.
const SELECT = `
SELECT e.id, e.name, e.phone, e.is_active AS isActive,
  (SELECT COALESCE(SUM(amount_earned), 0) FROM work_entries w WHERE w.employee_id = e.id)
  - (SELECT COALESCE(SUM(amount), 0) FROM advances a WHERE a.employee_id = e.id)
  - (SELECT COALESCE(SUM(amount), 0) FROM payouts p WHERE p.employee_id = e.id) AS balance
FROM employees e`
type EmpRow = Omit<Employee, 'isActive'> & { isActive: number }
const toEmp = (r: EmpRow): Employee => ({ ...r, isActive: !!r.isActive })

const list = (activeOnly: boolean): Employee[] =>
  all<EmpRow>(`${SELECT} ${activeOnly ? 'WHERE e.is_active = 1' : ''} ORDER BY e.is_active DESC, e.name COLLATE NOCASE`).map(toEmp)
const get = (id: ID): Employee | null => { const r = one<EmpRow>(`${SELECT} WHERE e.id = ?`, id); return r ? toEmp(r) : null }

function clean(i: EmployeeInput) {
  return { name: requireText(i?.name, 'Please enter a name'), phone: typeof i.phone === 'string' ? i.phone.trim() : '' }
}
function create(i: EmployeeInput): Employee {
  const e = clean(i)
  return get(insertId('INSERT INTO employees (name, phone) VALUES (?, ?)', e.name, e.phone))!
}
function update(id: ID, i: EmployeeInput): Employee {
  const e = clean(i)
  if (!get(id)) throw userError('This employee no longer exists.')
  run('UPDATE employees SET name = ?, phone = ? WHERE id = ?', e.name, e.phone, id)
  return get(id)!
}
const setActive = (id: ID, active: boolean): void => { run('UPDATE employees SET is_active = ? WHERE id = ?', active ? 1 : 0, id) }
const remove = (id: ID): void => { tx(() => run('DELETE FROM employees WHERE id = ?', id)) }

/** EM-8: this calendar month. balance = earned - advances (before any payouts). */
function monthSummary(id: ID): EmployeeMonth {
  const now = new Date()
  const [from, to] = monthRange(now.getFullYear(), now.getMonth() + 1)
  const sum = (table: string, col: string) =>
    one<{ s: number }>(`SELECT COALESCE(SUM(${col}), 0) AS s FROM ${table} WHERE employee_id = ? AND date >= ? AND date < ?`, id, from, to)!.s
  const earned = sum('work_entries', 'amount_earned'), advances = sum('advances', 'amount')
  return { earned, advances, balance: earned - advances }
}

function entries(id: ID, kind: EntryKind, from?: string, to?: string): Entry[] {
  const c = kindOf(kind)
  const w = ['employee_id = ?']
  const p: unknown[] = [id]
  const f = optionalDate(from), t = optionalDate(to)
  if (f) { w.push('date >= ?'); p.push(f) }
  if (t) { w.push('date <= ?'); p.push(t) }
  return all<Entry>(`SELECT id, employee_id AS employeeId, date, ${c.amount} AS amount, ${c.text} AS text FROM ${c.table} WHERE ${w.join(' AND ')} ORDER BY date DESC, id DESC`, ...p)
}
const entry = (kind: EntryKind, id: number): Entry => {
  const c = kindOf(kind)
  return one<Entry>(`SELECT id, employee_id AS employeeId, date, ${c.amount} AS amount, ${c.text} AS text FROM ${c.table} WHERE id = ?`, id)!
}
function cleanEntry(kind: EntryKind, i: EntryInput) {
  return {
    date: requireDate(i?.date),
    amount: wholeMoney(i.amount, 1),
    text: kind === 'work' ? requireText(i.text, 'Please say what work was done') : typeof i.text === 'string' ? i.text.trim() : ''
  }
}
function addEntry(id: ID, kind: EntryKind, i: EntryInput): Entry {
  const c = kindOf(kind), e = cleanEntry(kind, i)
  if (!get(id)) throw userError('This employee no longer exists.')
  return entry(kind, insertId(`INSERT INTO ${c.table} (employee_id, date, ${c.amount}, ${c.text}) VALUES (?, ?, ?, ?)`, id, e.date, e.amount, e.text))
}
function updateEntry(kind: EntryKind, entryId: ID, i: EntryInput): Entry {
  const c = kindOf(kind), e = cleanEntry(kind, i)
  if (!one(`SELECT 1 FROM ${c.table} WHERE id = ?`, entryId)) throw userError('This entry no longer exists.')
  run(`UPDATE ${c.table} SET date = ?, ${c.amount} = ?, ${c.text} = ? WHERE id = ?`, e.date, e.amount, e.text, entryId)
  return entry(kind, entryId)
}
const removeEntry = (kind: EntryKind, entryId: ID): void => { run(`DELETE FROM ${kindOf(kind).table} WHERE id = ?`, entryId) }

export const employees = { list, get, create, update, setActive, remove, monthSummary, entries, addEntry, updateEntry, removeEntry }
