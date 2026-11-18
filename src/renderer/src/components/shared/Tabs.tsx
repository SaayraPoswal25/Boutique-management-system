import { Button } from '@/components/ui/button'

export const Tabs = ({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) => (
  <div role="tablist" className="my-3 flex flex-wrap gap-2">
    {tabs.map((t) => <Button key={t} role="tab" aria-selected={t === value} variant={t === value ? 'primary' : 'outline'} onClick={() => onChange(t)}>{t}</Button>)}
  </div>
)
