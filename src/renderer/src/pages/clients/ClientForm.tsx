import type { Client, ClientInput } from '@shared/types'
import { FormDialog } from '@/components/shared/FormDialog'
import { api, mutate } from '@/lib/api'
import { check, clientSchema } from '@/lib/schemas'
import { digits } from '@/lib/utils'

/** S3 Add / Edit Client. Warns (does not block) when the phone number already exists (CL-4). */
export function ClientFormDialog({ client, initial, onClose, onSaved }: { client?: Client; initial?: Partial<ClientInput>; onClose: () => void; onSaved?: (c: Client) => void }) {
  return (
    <FormDialog
      title={client ? 'Edit Client' : 'Add New Client'} saveLabel="Save Client" savedMessage="Client saved" onClose={onClose}
      fields={[{ name: 'name', label: 'Name', required: true }, { name: 'phone', label: 'Phone number', required: true }, { name: 'notes', label: 'Notes', type: 'textarea', voice: true }]}
      initial={{ name: client?.name ?? initial?.name ?? '', phone: client?.phone ?? initial?.phone ?? '', notes: client?.notes ?? initial?.notes ?? '' }}
      validate={check(clientSchema)}
      checkWarning={async (v) => {
        if (digits(v.phone).length < 6) return null
        const o = await api.clients.findByPhone(v.phone)
        return o && o.id !== client?.id ? `This phone number already belongs to ${o.name}. You can still save.` : null
      }}
      onSave={async (v) => {
        const i = { name: v.name.trim(), phone: v.phone.trim(), notes: v.notes }
        const saved = await mutate(client ? api.clients.update(client.id, i) : api.clients.create(i))
        onSaved?.(saved)
      }}
    />
  )
}
