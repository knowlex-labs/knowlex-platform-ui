import * as React from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
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
import { ForgotPasswordPage } from '@/components/auth/forgot-password-page'
import { ResetPasswordPage } from '@/components/auth/reset-password-page'
import { VerifyEmailPage } from '@/components/auth/verify-email-page'
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
import { FeatureGate } from '@/components/feature-gate'
import { PricingPage } from '@/components/landing/pricing-page'
import { AboutPage } from '@/components/landing/about-page'
import { CareersPage } from '@/components/landing/careers-page'
import {
  DASHBOARD_ORIGIN,
  MARKETING_ORIGIN,
  isDashboardHost,
  isLocalHost,
  isMarketingHost,
} from '@/lib/hosts'

function HostRedirect({ to }: { to: 'dashboard' | 'marketing' }) {
  const location = useLocation()
  React.useEffect(() => {
    const origin = to === 'dashboard' ? DASHBOARD_ORIGIN : MARKETING_ORIGIN
    window.location.replace(`${origin}${location.pathname}${location.search}${location.hash}`)
  }, [to, location])
  return null
}

function MarketingOnly({ children }: { children: React.ReactNode }) {
  if (isLocalHost || isMarketingHost) return <>{children}</>
  return <HostRedirect to="marketing" />
}

function DashboardOnly({ children }: { children: React.ReactNode }) {
  if (isLocalHost || isDashboardHost) return <>{children}</>
  return <HostRedirect to="dashboard" />
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: isDashboardHost ? (
      <Navigate to="/login" replace />
    ) : (
      <MarketingOnly><LandingRoute /></MarketingOnly>
    ),
  },
  {
    path: '/login',
    element: <DashboardOnly><LoginPage /></DashboardOnly>,
  },
  {
    path: '/signup',
    element: <DashboardOnly><SignupPage /></DashboardOnly>,
  },
  {
    path: '/forgot-password',
    element: <DashboardOnly><ForgotPasswordPage /></DashboardOnly>,
  },
  {
    path: '/reset-password',
    element: <DashboardOnly><ResetPasswordPage /></DashboardOnly>,
  },
  {
    path: '/verify-email',
    element: <DashboardOnly><VerifyEmailPage /></DashboardOnly>,
  },
  {
    path: '/pricing',
    element: <MarketingOnly><PricingPage /></MarketingOnly>,
  },
  {
    path: '/about',
    element: <MarketingOnly><AboutPage /></MarketingOnly>,
  },
  {
    path: '/careers',
    element: <MarketingOnly><CareersPage /></MarketingOnly>,
  },
  // Public blog (no auth required) — marketing host only
  {
    element: <MarketingOnly><BlogLayout /></MarketingOnly>,
    children: [
      { path: '/blogs', element: <BlogListPage /> },
      { path: '/blogs/:slug', element: <BlogDetailPage /> },
    ],
  },
  // Admin login (dashboard host only)
  {
    path: '/admin/login',
    element: <DashboardOnly><AdminLoginPage /></DashboardOnly>,
  },
  // Admin protected (dashboard host + admin auth)
  {
    element: <DashboardOnly><AdminLayout /></DashboardOnly>,
    children: [
      { path: '/admin', element: <AdminDashboard /> },
      { path: '/admin/blog', element: <BlogAdminList /> },
      { path: '/admin/blog/new', element: <BlogFormPage /> },
      { path: '/admin/blog/:id/edit', element: <BlogFormPage /> },
    ],
  },
  {
    element: <DashboardOnly><ProtectedLayout /></DashboardOnly>,
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
      { path: '/moodboard', element: <FeatureGate name="MOODBOARD"><MoodboardBoard /></FeatureGate> },
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
