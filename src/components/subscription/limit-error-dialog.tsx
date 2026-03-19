import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface LimitErrorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

export function LimitErrorDialog({ open, onOpenChange, message }: LimitErrorDialogProps) {
  const navigate = useNavigate()
  const suggestsTopUp = message.toLowerCase().includes('wallet') || message.toLowerCase().includes('balance')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Usage Limit Reached
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Dismiss
          </Button>
          {suggestsTopUp ? (
            <Button
              onClick={() => {
                onOpenChange(false)
                navigate('/settings/wallet')
              }}
            >
              Top Up Wallet
            </Button>
          ) : (
            <Button
              onClick={() => {
                onOpenChange(false)
                navigate('/plans')
              }}
            >
              Upgrade Plan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
