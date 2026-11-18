import { useMoney } from '@/hooks/useSettings'
export const MoneyText = ({ amount, className }: { amount: number; className?: string }) => <span className={className}>{useMoney()(amount)}</span>
