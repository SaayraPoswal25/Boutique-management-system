import { Button } from '@/components/ui/button'

export const EmptyState = ({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) => (
  <div className="rounded-xl border bg-card p-8 text-center">
    <p className="mb-4 text-lg">{message}</p>
    {actionLabel && <Button variant="primary" onClick={onAction}>{actionLabel}</Button>}
  </div>
)
