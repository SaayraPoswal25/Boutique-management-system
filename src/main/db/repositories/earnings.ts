import type { MonthDetail, MonthEarnings, Payment, YearTotal } from '@shared/types'
import { all, monthRange, userError } from '../util'
import { queryBills } from './bills'

const checkYear = (y: number) => { if (!Number.isInteger(y) || y < 1900 || y > 3000) throw userError('That year is not valid.'); return y }

/** EA-4. Received = payments by PAYMENT date; Billed = bills by BILL date; Still pending = what is unpaid on that month's bills. */
function year(y: number): MonthEarnings[] {
  checkYear(y)
  const from = monthRange(y, 1)[0], end = monthRange(y, 12)[1] // the whole year: Jan 1 up to (not including) next Jan 1
  const billed = new Map(all<{ m: number; billed: number; pending: number }>(
    `SELECT CAST(substr(date, 6, 2) AS INTEGER) AS m, SUM(total) AS billed,
            SUM(CASE WHEN total - paid > 0 THEN total - paid ELSE 0 END) AS pending
     FROM bill_totals WHERE date >= ? AND date < ? GROUP BY m`, from, end).map((r) => [r.m, r]))
  const received = new Map(all<{ m: number; received: number }>(
    `SELECT CAST(substr(date, 6, 2) AS INTEGER) AS m, SUM(amount) AS received
     FROM payments WHERE date >= ? AND date < ? GROUP BY m`, from, end).map((r) => [r.m, r.received]))
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1, billed: billed.get(i + 1)?.billed ?? 0, received: received.get(i + 1) ?? 0, pending: billed.get(i + 1)?.pending ?? 0
  }))
}

/** EA-7: every year that has any bill or payment, newest first. */
function allYears(): YearTotal[] {
  return all<{ y: string; received: number }>(
    `SELECT y, SUM(received) AS received FROM (
       SELECT substr(date, 1, 4) AS y, amount AS received FROM payments
       UNION ALL SELECT substr(date, 1, 4), 0 FROM bills) GROUP BY y ORDER BY y DESC`
  ).map((r) => ({ year: Number(r.y), received: r.received }))
}

/** EA-6 */
function month(y: number, m: number): MonthDetail {
  checkYear(y)
  if (!Number.isInteger(m) || m < 1 || m > 12) throw userError('That month is not valid.')
  const [from, to] = monthRange(y, m)
  const payments = all<{ id: number; billId: number; date: string; amount: number; note: string; clientName: string }>(
    `SELECT p.id, p.bill_id AS billId, p.date, p.amount, p.note, c.name AS clientName
     FROM payments p JOIN bills b ON b.id = p.bill_id JOIN clients c ON c.id = b.client_id
     WHERE p.date >= ? AND p.date < ? ORDER BY p.date, p.id`, from, to)
  return { bills: queryBills('t.date >= ? AND t.date < ?', [from, to]), payments: payments as (Payment & { clientName: string })[] }
}

export const earnings = { year, allYears, month }
