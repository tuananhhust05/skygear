/**
 * Backend configuration
 * Centralized configuration for backend URL to ensure easy maintenance and scalability
 */

// Get backend base URL from environment variable or use default
const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://skygear.online'

// Backend base URL (without /api)
export const BACKEND_URL = BACKEND_BASE_URL

// API base URL (with /api)
export const API_URL = `${BACKEND_BASE_URL}/api`

