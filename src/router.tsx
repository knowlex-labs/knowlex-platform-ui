import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingRoute } from '@/routes/landing-route'
import { ProtectedLayout } from '@/routes/protected-layout'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { CaseList } from '@/components/cases/case-list'
import { CaseWorkspace } from '@/components/cases/case-workspace'
import { ClientList } from '@/components/clients/client-list'
import { ClientDetail } from '@/components/clients/client-detail'
import { AIResearch } from '@/components/ai-research/ai-research'
import { Judgments } from '@/components/judgments/judgments'
import { CauseLists } from '@/components/cause-lists/cause-lists'
import { JudgmentDetail } from '@/components/judgments/judgment-detail'
import { AccountSettings } from '@/components/settings/account-settings'
import { SettingsLayout } from '@/components/settings/settings-layout'
import { BillingPage } from '@/components/settings/billing-page'
import { WalletPage } from '@/components/settings/wallet-page'
import { PlanSelectionPage } from '@/components/plans/plan-selection-page'
import { NotFound } from '@/components/not-found'
import { LoginPage } from '@/components/auth/login-page'
import { BlogLayout } from '@/components/blog/blog-layout'
import { BlogListPage } from '@/components/blog/blog-list-page'
import { BlogDetailPage } from '@/components/blog/blog-detail-page'
import { AdminLoginPage } from '@/components/admin/admin-login-page'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { BlogAdminList } from '@/components/admin/blog/blog-admin-list'
import { BlogFormPage } from '@/components/admin/blog/blog-form-page'

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
  // Public blog (no auth required)
  {
    element: <BlogLayout />,
    children: [
      { path: '/blogs', element: <BlogListPage /> },
      { path: '/blogs/:slug', element: <BlogDetailPage /> },
    ],
  },
  // Plans page (accessible both authenticated and unauthenticated)
  {
    path: '/plans',
    element: <PlanSelectionPage />,
  },
  // Admin login (no auth required)
  {
    path: '/admin/login',
    element: <AdminLoginPage />,
  },
  // Admin protected (admin auth required)
  {
    element: <AdminLayout />,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/blog', element: <BlogAdminList /> },
      { path: '/admin/blog/new', element: <BlogFormPage /> },
      { path: '/admin/blog/:id/edit', element: <BlogFormPage /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: '/home', element: <DashboardHome /> },
      { path: '/cases', element: <CaseList /> },
      { path: '/cases/:caseId', element: <CaseWorkspace /> },
      { path: '/cause-lists', element: <CauseLists /> },
      { path: '/clients', element: <ClientList /> },
      { path: '/clients/:clientId', element: <ClientDetail /> },
      { path: '/judgments', element: <Judgments /> },
      { path: '/judgments/:judgmentId', element: <JudgmentDetail /> },
      { path: '/ai-research', element: <AIResearch /> },
      {
        path: '/settings',
        element: <SettingsLayout />,
        children: [
          { index: true, element: <AccountSettings /> },
          { path: 'billing', element: <BillingPage /> },
          { path: 'wallet', element: <WalletPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
