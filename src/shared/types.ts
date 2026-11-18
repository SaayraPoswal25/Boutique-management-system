export type ID = number
export type GarmentStatus = 'In Progress' | 'Ready' | 'Delivered'
export type EntryKind = 'work' | 'advance' | 'payout'
export type BillStatus = 'Paid' | 'Pending'
export type TextSize = 'normal' | 'large' | 'xlarge'

export interface ClientInput { name: string; phone: string; notes: string }
export interface Client extends ClientInput { id: ID; pendingAmount: number; lastVisit: string | null }
export interface DeletePreview { measurements: number; garments: number; bills: number }

export const MEASUREMENT_FIELDS = ['chest', 'waist', 'hip', 'shoulder', 'sleeveLength', 'sleeveRound', 'neck', 'garmentLength', 'inseam'] as const
export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]
export type MeasurementInput = { date: string; garmentType: string; notes: string } & Record<MeasurementField, number | null>
export interface Measurement extends MeasurementInput { id: ID; clientId: ID }

export interface GarmentInput {
  description: string; dateOrdered: string; deliveryDate: string | null
  price: number; status: GarmentStatus; notes: string; photos: string[] // photos = file names only
}
export interface Garment extends GarmentInput { id: ID; clientId: ID; billId: ID | null }

export interface PaymentInput { date: string; amount: number; note: string }
export interface Payment extends PaymentInput { id: ID; billId: ID }
export interface BillInput { clientId: ID; date: string; discount: number; notes: string; garmentIds: ID[] }
export interface Bill {
  id: ID; clientId: ID; clientName: string; clientPhone: string; date: string
  discount: number; notes: string; total: number; paid: number; balance: number; status: BillStatus
}
export interface BillDetail extends Bill { garments: Garment[]; payments: Payment[] }
export interface PendingBill { billId: ID; clientId: ID; clientName: string; clientPhone: string; date: string; balance: number; ageDays: number }

export interface EmployeeInput { name: string; phone: string }
export interface Employee extends EmployeeInput { id: ID; isActive: boolean; balance: number }
/** `text` is the work description (kind 'work') or the note (advance / payout). */
export interface EntryInput { date: string; amount: number; text: string }
export interface Entry extends EntryInput { id: ID; employeeId: ID }
export interface EmployeeMonth { earned: number; advances: number; balance: number }

export interface MonthEarnings { month: number; billed: number; received: number; pending: number } // month 1-12
export interface YearTotal { year: number; received: number }
export interface MonthDetail { bills: Bill[]; payments: (Payment & { clientName: string })[] }

export interface Settings {
  businessName: string; businessPhone: string; measurementUnit: 'in' | 'cm'; currencySymbol: string
  textSize: TextSize; autoBackup: boolean; backupLocation: string; pendingWarnDays: number
  lastBackupAt: string | null; voiceEnabled: boolean; microphoneId: string
}
export const DEFAULT_SETTINGS: Settings = {
  businessName: '', businessPhone: '', measurementUnit: 'in', currencySymbol: '₹', textSize: 'normal',
  autoBackup: true, backupLocation: '', pendingWarnDays: 30, lastBackupAt: null, voiceEnabled: true, microphoneId: ''
}
