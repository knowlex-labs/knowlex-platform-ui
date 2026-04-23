import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LandingRoute } from '@/routes/landing-route'
import { ProtectedLayout } from '@/routes/protected-layout'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { CaseList } from '@/components/cases/case-list'
import { CaseWorkspace } from '@/components/cases/case-workspace'
import { ClientList } from '@/components/clients/client-list'
import { ClientDetail } from '@/components/clients/client-detail'
import { LegalLibrary } from '@/components/judgments/legal-library'
import { CauseLists } from '@/components/cause-lists/cause-lists'
import { JudgmentDetail } from '@/components/judgments/judgment-detail'
import { AccountSettings } from '@/components/settings/account-settings'
import { SettingsLayout } from '@/components/settings/settings-layout'
import { BillingPage } from '@/components/settings/billing-page'
import { WalletPage } from '@/components/settings/wallet-page'
import { NotFound } from '@/components/not-found'
import { LoginPage } from '@/components/auth/login-page'
import { SignupPage } from '@/components/auth/signup-page'
import { BlogLayout } from '@/components/blog/blog-layout'
import { BlogListPage } from '@/components/blog/blog-list-page'
import { BlogDetailPage } from '@/components/blog/blog-detail-page'
import { AdminLoginPage } from '@/components/admin/admin-login-page'
import { AdminLayout } from '@/components/admin/admin-layout'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { BlogAdminList } from '@/components/admin/blog/blog-admin-list'
import { BlogFormPage } from '@/components/admin/blog/blog-form-page'
import { DocumentsPage } from '@/components/documents/documents-page'
import { DraftingPage } from '@/components/drafting/drafting-page'
import { MoodboardBoard } from '@/components/moodboard/moodboard-board'
import { PricingPage } from '@/components/landing/pricing-page'
import { AboutPage } from '@/components/landing/about-page'
import { CareersPage } from '@/components/landing/careers-page'

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
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/pricing',
    element: <PricingPage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/careers',
    element: <CareersPage />,
  },
  // Public blog (no auth required)
  {
    element: <BlogLayout />,
    children: [
      { path: '/blogs', element: <BlogListPage /> },
      { path: '/blogs/:slug', element: <BlogDetailPage /> },
    ],
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
      { path: '/drafting', element: <DraftingPage /> },
      { path: '/cause-lists', element: <CauseLists /> },
      { path: '/clients', element: <ClientList /> },
      { path: '/clients/:clientId', element: <ClientDetail /> },
      { path: '/judgments', element: <LegalLibrary /> },
      { path: '/judgments/:judgmentId', element: <JudgmentDetail /> },
{ path: '/documents', element: <DocumentsPage /> },
      { path: '/moodboard', element: <MoodboardBoard /> },
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
