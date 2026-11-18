import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export const formatRupees = (n: number, symbol = '₹'): string =>
  `${n < 0 ? '−' : ''}${symbol}${Math.abs(Math.round(n)).toLocaleString('en-IN')}`

/** ISO 'YYYY-MM-DD' -> '27 Oct 2026' */
export const formatDate = (iso: string): string => format(parseISO(iso), 'd MMM yyyy')
export const todayISO = (): string => format(new Date(), 'yyyy-MM-dd')
export const daysSince = (iso: string): number => differenceInCalendarDays(new Date(), parseISO(iso))
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
