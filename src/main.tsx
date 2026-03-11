import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from '@/contexts/theme-context'
import { AuthProvider } from '@/contexts/auth-context'
import { UIStateProvider } from '@/contexts/ui-context'
import { Toaster } from '@/components/ui/toaster'
import { router } from '@/router'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <UIStateProvider>
        <RouterProvider router={router} />
        <Toaster />
      </UIStateProvider>
    </AuthProvider>
  </ThemeProvider>
)
