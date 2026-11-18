import { z } from 'zod'

type Values = Record<string, string>
/** Turns a zod schema into { fieldName: friendly message } for FormDialog. */
export const check = (schema: z.ZodTypeAny) => (v: Values): Values => {
  const r = schema.safeParse(v)
  if (r.success) return {}
  const out: Values = {}
  for (const i of r.error.issues) { const k = String(i.path[0]); if (!out[k]) out[k] = i.message }
  return out
}
export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Please enter a name'),
  phone: z.string().trim().min(1, 'Please enter a phone number'),
  notes: z.string().optional()
})
export const paymentSchema = (balance: number, fmt: (n: number) => string) => z.object({
  date: z.string().min(1, 'Please choose a date'),
  amount: z.string()
    .refine((s) => Number(s) > 0, 'Please enter an amount above zero')
    .refine((s) => Number(s) <= balance, `This is more than the balance of ${fmt(balance)}.`)
})
export const amountSchema = z.object({
  date: z.string().min(1, 'Please choose a date'),
  amount: z.string().refine((s) => Number(s) > 0, 'Please enter an amount above zero')
})
