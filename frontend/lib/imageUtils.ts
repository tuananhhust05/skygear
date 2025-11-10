import { BACKEND_URL } from './config'

/**
 * Get full URL for an image path
 * If path already contains http/https, return as is
 * Otherwise, prepend backend URL
 */
export function getImageUrl(path: string | string[] | undefined | null): string | null {
  // Handle null/undefined
  if (!path) return null
  
  // Handle array - take first element
  if (Array.isArray(path)) {
    if (path.length === 0) return null
    path = path[0]
  }
  
  // Ensure path is a string
  if (typeof path !== 'string') return null
  
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  
  return `${BACKEND_URL}${cleanPath}`
}

/**
 * Get avatar URL with fallback
 */
export function getAvatarUrl(avatar: string | undefined | null, fallback?: string): string {
  const url = getImageUrl(avatar)
  return url || fallback || ''
}
