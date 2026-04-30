export const MARKETING_ORIGIN = 'https://www.getknowlex.com'
export const DASHBOARD_ORIGIN = 'https://dashboard.getknowlex.com'

const hostname = typeof window !== 'undefined' ? window.location.hostname : ''

export const isDashboardHost = hostname === 'dashboard.getknowlex.com'
export const isMarketingHost =
  hostname === 'www.getknowlex.com' || hostname === 'getknowlex.com'
export const isLocalHost =
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname.endsWith('.local') ||
  hostname.endsWith('.localhost')

export function dashboardUrl(path: string): string {
  return isDashboardHost || isLocalHost ? path : `${DASHBOARD_ORIGIN}${path}`
}

export function marketingUrl(path: string): string {
  return isMarketingHost || isLocalHost ? path : `${MARKETING_ORIGIN}${path}`
}

export function goToDashboard(path: string): void {
  if (isDashboardHost || isLocalHost) {
    window.location.assign(path)
  } else {
    window.location.assign(`${DASHBOARD_ORIGIN}${path}`)
  }
}

export function goToMarketing(path: string): void {
  if (isMarketingHost || isLocalHost) {
    window.location.assign(path)
  } else {
    window.location.assign(`${MARKETING_ORIGIN}${path}`)
  }
}
