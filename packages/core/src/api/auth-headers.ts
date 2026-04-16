import { getAdapters } from './runtime'

export function getAuthHeaders(): Record<string, string> {
  const { storage } = getAdapters()
  const headers: Record<string, string> = {}
  const token = storage.getItem('auth_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const userId = storage.getItem('auth_user_id')
  if (userId) headers['x-user-id'] = userId
  return headers
}

export function getAdminAuthHeaders(): Record<string, string> {
  const { storage } = getAdapters()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const token = storage.getItem('admin_auth_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const userId = storage.getItem('admin_user_id')
  if (userId) headers['x-user-id'] = userId
  return headers
}
