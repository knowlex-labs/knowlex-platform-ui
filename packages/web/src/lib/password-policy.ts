export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.'
  if (pw.length > 128) return 'Password must be 128 characters or fewer.'
  if (!/[A-Za-z]/.test(pw)) return 'Password must include a letter.'
  if (!/\d/.test(pw)) return 'Password must include a digit.'
  return null
}
