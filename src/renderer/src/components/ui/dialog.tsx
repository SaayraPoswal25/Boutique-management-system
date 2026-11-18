import * as D from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export const Dialog = D.Root
/** Esc closes it (UI-12). */
export function DialogContent({ title, description, children, className }: { title: string; description?: string; children: ReactNode; className?: string }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <D.Content className={cn('fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-card p-6 shadow-xl', className)}>
        <D.Title className="text-xl font-semibold">{title}</D.Title>
        <D.Description className={description ? 'mt-1 text-muted-foreground' : 'sr-only'}>{description ?? title}</D.Description>
        <div className="mt-4">{children}</div>
      </D.Content>
    </D.Portal>
  )
}
