import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// UI-3: only one "primary" button per screen or dialog. UI-4: at least 44px tall.
const variants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-base font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border bg-card hover:bg-muted',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        dangerOutline: 'border border-danger bg-card text-danger hover:bg-danger-soft'
      }
    },
    defaultVariants: { variant: 'outline' }
  }
)
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof variants>>(
  ({ className, variant, type = 'button', ...p }, ref) => <button ref={ref} type={type} className={cn(variants({ variant }), className)} {...p} />
)
Button.displayName = 'Button'
