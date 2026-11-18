import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { ToastProvider } from '@/components/shared/Toast'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { SettingsProvider } from '@/hooks/useSettings'
import BackupPage from '@/pages/backup/BackupPage'
import BillDetail from '@/pages/bills/BillDetail'
import BillsList from '@/pages/bills/BillsList'
import PendingBillsPanel from '@/pages/bills/PendingBillsPanel'
import ClientProfile from '@/pages/clients/ClientProfile'
import ClientsList from '@/pages/clients/ClientsList'
import Earnings from '@/pages/earnings/Earnings'
import MonthDetail from '@/pages/earnings/MonthDetail'
import EmployeeProfile from '@/pages/employees/EmployeeProfile'
import EmployeesList from '@/pages/employees/EmployeesList'
import { PendingBillsPopup } from '@/pages/launch/PendingBillsPopup'
import SettingsPage from '@/pages/settings/SettingsPage'

// HashRouter: the packaged app loads from file://, so path-based routing would break.
export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ToastProvider>
          <HashRouter>
            <div className="flex min-h-screen flex-col">
              <TopBar />
              <div className="flex flex-1">
                <Sidebar />
                <main className="min-w-0 flex-1 p-6">
                  <Routes>
                    <Route path="/" element={<ClientsList />} />
                    <Route path="/clients/:id" element={<ClientProfile />} />
                    <Route path="/bills" element={<BillsList />} />
                    <Route path="/bills/:id" element={<BillDetail />} />
                    <Route path="/pending" element={<PendingBillsPanel />} />
                    <Route path="/earnings" element={<Earnings />} />
                    <Route path="/earnings/:year/:month" element={<MonthDetail />} />
                    <Route path="/employees" element={<EmployeesList />} />
                    <Route path="/employees/:id" element={<EmployeeProfile />} />
                    <Route path="/backup" element={<BackupPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
              <PendingBillsPopup />
            </div>
          </HashRouter>
        </ToastProvider>
      </SettingsProvider>
    </ErrorBoundary>
  )
}
