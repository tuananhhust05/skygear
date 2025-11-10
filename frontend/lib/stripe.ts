/**
 * Stripe configuration
 * Centralized configuration for Stripe to ensure easy maintenance
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'

// Get Stripe publishable key from environment variable
const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

