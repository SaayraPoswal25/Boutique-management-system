import type { Employee } from '@shared/types'
import { FormDialog } from '@/components/shared/FormDialog'
import { api, mutate } from '@/lib/api'

/** S17 Add / Edit Employee: name and phone only (EM-1). No salary. */
export function EmployeeFormDialog({ employee, onClose }: { employee?: Employee; onClose: () => void }) {
  return (
    <FormDialog title={employee ? 'Edit Employee' : 'Add New Employee'} saveLabel="Save Employee" savedMessage="Employee saved" onClose={onClose}
      fields={[{ name: 'name', label: 'Name', required: true }, { name: 'phone', label: 'Phone number', required: true }]}
      initial={{ name: employee?.name ?? '', phone: employee?.phone ?? '' }}
      onSave={async (v) => { const i = { name: v.name.trim(), phone: v.phone.trim() }; await mutate(employee ? api.employees.update(employee.id, i) : api.employees.create(i)) }} />
  )
}
