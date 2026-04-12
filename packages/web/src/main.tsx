import { bootstrapCore } from '@/adapters/init-core'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { AuthProvider } from '@/contexts/auth-context'
import { AdminAuthProvider } from '@/contexts/admin-auth-context'
import { UIStateProvider } from '@/contexts/ui-context'
import { Toaster } from '@/components/ui/toaster'
import { router } from '@/router'
import './index.css'

bootstrapCore()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <AdminAuthProvider>
        <UIStateProvider>
          <RouterProvider router={router} />
          <Toaster />
        </UIStateProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </ThemeProvider>
)
