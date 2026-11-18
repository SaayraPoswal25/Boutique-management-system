import { api } from '@/lib/api'
import { useAsync } from './useAsync'

export function usePendingBills() {
  const { data } = useAsync(() => api.bills.pending(), [])
  const list = data ?? []
  return { list, count: list.length, total: list.reduce((s, b) => s + b.balance, 0), loaded: data !== null }
}
