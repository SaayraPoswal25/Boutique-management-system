import { useState } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

/** GA-3 / GA-7: a missing file shows "Photo not found" instead of crashing. */
export function GarmentPhoto({ file, className }: { file: string; className?: string }) {
  const [bad, setBad] = useState(false)
  if (bad) return <div className={cn('flex items-center justify-center rounded-lg bg-muted p-2 text-center text-sm text-muted-foreground', className)}>Photo not found</div>
  return <img src={api.photos.url(file)} alt="Garment" onError={() => setBad(true)} className={cn('rounded-lg object-cover', className)} />
}
