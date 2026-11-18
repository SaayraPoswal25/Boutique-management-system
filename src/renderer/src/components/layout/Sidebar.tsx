import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

// UI-1: big text labels, never icon-only.
const items = [['/', 'Clients'], ['/bills', 'Bills'], ['/earnings', 'Earnings'], ['/employees', 'Employees'], ['/backup', 'Backup'], ['/settings', 'Settings']]
export const Sidebar = () => (
  <nav aria-label="Main" className="flex w-52 shrink-0 flex-col gap-1.5 bg-muted p-3">
    {items.map(([to, label]) => (
      <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => cn('flex min-h-11 items-center rounded-lg px-4 text-lg', isActive ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-card')}>{label}</NavLink>
    ))}
  </nav>
)
