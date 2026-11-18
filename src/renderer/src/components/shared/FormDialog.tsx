import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input, Textarea } from '@/components/ui/input'
import { friendly } from '@/lib/api'
import { ui } from '@/lib/utils'
import { useToast } from './Toast'
import { VoiceNotesField } from './VoiceNotesField'

export type Values = Record<string, string>
export interface FieldDef { name: string; label: string; type?: 'text' | 'number' | 'date' | 'textarea' | 'select'; required?: boolean; options?: string[]; voice?: boolean }
interface Props {
  title: string; saveLabel: string; savedMessage: string; fields: FieldDef[]; initial?: Values
  validate?: (v: Values) => Values; checkWarning?: (v: Values) => Promise<string | null>
  extra?: ReactNode; onSave: (v: Values) => Promise<void>; onClose: () => void
}

/** One form dialog used by every "Add / Edit" screen: friendly errors next to the field (UI-7),
 *  Enter saves, Esc closes (UI-12), and a clear "saved" message afterwards (UI-6). */
export function FormDialog(p: Props) {
  const [values, setValues] = useState<Values>(() => Object.fromEntries(p.fields.map((f) => [f.name, p.initial?.[f.name] ?? ''])))
  const [errors, setErrors] = useState<Values>({}), [warn, setWarn] = useState<string | null>(null)
  const [busy, setBusy] = useState(false), [fail, setFail] = useState('')
  const toast = useToast()
  const set = (n: string, v: string) => setValues((x) => ({ ...x, [n]: v }))

  useEffect(() => {
    if (!p.checkWarning) return
    const t = setTimeout(() => p.checkWarning!(values).then(setWarn).catch(() => setWarn(null)), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const er: Values = {}
    for (const f of p.fields) if (f.required && !values[f.name].trim()) er[f.name] = 'Please fill this in'
    Object.assign(er, p.validate?.(values) ?? {})
    setErrors(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try { await p.onSave(values); toast(p.savedMessage); p.onClose() } catch (x) { setFail(friendly(x)); setBusy(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && p.onClose()}>
      <DialogContent title={p.title}>
        <form onSubmit={submit} noValidate>
          {p.fields.map((f) => {
            const label = f.label + (f.required ? ' (required)' : '')
            if (f.voice) return <VoiceNotesField key={f.name} label={label} multiline={f.type === 'textarea'} value={values[f.name]} onChange={(v) => set(f.name, v)} error={errors[f.name]} />
            return (
              <div key={f.name} className="mb-4">
                <label className="mb-1 block font-semibold">
                  {label}
                  {f.type === 'textarea' ? <Textarea className="mt-1 font-normal" value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />
                    : f.type === 'select' ? <select className={ui.input + ' mt-1 font-normal'} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)}>{f.options!.map((o) => <option key={o} value={o}>{o || 'Not specified'}</option>)}</select>
                    : <Input className="mt-1 font-normal" type={f.type ?? 'text'} inputMode={f.type === 'number' ? 'decimal' : undefined} value={values[f.name]} onChange={(e) => set(f.name, e.target.value)} />}
                </label>
                {errors[f.name] && <p className="mt-1 text-sm text-danger">{errors[f.name]}</p>}
              </div>
            )
          })}
          {p.extra}
          {warn && <p className="mb-3 rounded-lg bg-danger-soft p-3 text-danger">{warn}</p>}
          {fail && <p className="mb-3 text-danger">{fail}</p>}
          <div className="flex gap-3"><Button type="submit" variant="primary" disabled={busy}>{p.saveLabel}</Button><Button onClick={p.onClose}>Cancel</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
