const PREFIX_RE = /^hon['']?ble\b/i

export function formatJudgeName(name: string | null | undefined): string {
  const trimmed = name?.trim()
  if (!trimmed) return ''
  return PREFIX_RE.test(trimmed) ? trimmed : `Hon'ble ${trimmed}`
}
