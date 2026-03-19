// Razorpay Checkout integration

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

export interface RazorpayOptions {
  key: string
  amount?: number
  currency?: string
  name?: string
  description?: string
  order_id?: string
  subscription_id?: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  handler: (response: RazorpayPaymentResponse) => void
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string
  razorpay_order_id?: string
  razorpay_subscription_id?: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
  close: () => void
}

let scriptPromise: Promise<void> | null = null

export function loadRazorpayScript(): Promise<void> {
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Razorpay script'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export async function openRazorpayCheckout(options: RazorpayOptions): Promise<void> {
  await loadRazorpayScript()
  const rzp = new window.Razorpay(options)
  rzp.open()
}
