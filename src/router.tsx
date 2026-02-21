import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingRoute } from '@/routes/landing-route'
import { ProtectedLayout } from '@/routes/protected-layout'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { CaseList } from '@/components/cases/case-list'
import { CaseWorkspace } from '@/components/cases/case-workspace'
import { ClientList } from '@/components/clients/client-list'
import { ClientDetail } from '@/components/clients/client-detail'
import { AIResearch } from '@/components/ai-research/ai-research'
import { AccountSettings } from '@/components/settings/account-settings'
import { NotFound } from '@/components/not-found'
import { LoginPage } from '@/components/auth/login-page'

const isDashboardSubdomain = window.location.hostname.startsWith('dashboard.')

export const router = createBrowserRouter([
  {
    path: '/',
    element: isDashboardSubdomain ? <Navigate to="/login" replace /> : <LandingRoute />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/home', element: <DashboardHome /> },
      { path: '/cases', element: <CaseList /> },
      { path: '/cases/:caseId', element: <CaseWorkspace /> },
      { path: '/clients', element: <ClientList /> },
      { path: '/clients/:clientId', element: <ClientDetail /> },
      { path: '/ai-research', element: <AIResearch /> },
      { path: '/settings', element: <AccountSettings /> },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
