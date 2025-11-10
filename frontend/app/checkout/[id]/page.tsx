'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { MainLayout } from '@/components/layout/MainLayout'
import api from '@/lib/api'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Coins } from 'lucide-react'

// Stripe publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Stripe Payment Form Component
function StripePaymentForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders`,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast({
          title: 'Payment Failed',
          description: error.message,
          variant: 'destructive',
        })
        setProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        toast({
          title: 'Success',
          description: 'Payment processed successfully',
        })
        onSuccess()
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Payment failed',
        variant: 'destructive',
      })
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" className="w-full" size="lg" disabled={!stripe || processing}>
        {processing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  )
}

// Stripe Elements Wrapper Component
function StripeElementsWrapper({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  if (!clientSecret) return null

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm clientSecret={clientSecret} onSuccess={onSuccess} />
    </Elements>
  )
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [deliveryMethod, setDeliveryMethod] = useState('pickup')
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null)
  const [paymentInitialized, setPaymentInitialized] = useState(false)
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${params.id}`)
      setOrder(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load order',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const initializePayment = async () => {
    if (paymentInitialized) return

    try {
      setPaymentInitialized(true)
      const response = await api.post('/payments/initialize', {
        orderId: order._id,
        paymentMethod: paymentMethod === 'card' ? 'stripe' : paymentMethod,
      })

      // Handle Stripe payment
      if (response.data.paymentMethod === 'stripe' && response.data.clientSecret) {
        setStripeClientSecret(response.data.clientSecret)
      } 
      // Handle Bridge.xyz payment
      else if (response.data.paymentMethod === 'bridge' && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl
      } else {
        toast({
          title: 'Success',
          description: 'Payment processed successfully',
        })
        router.push(`/orders/${order._id}`)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Payment initialization failed',
        variant: 'destructive',
      })
      setPaymentInitialized(false)
    }
  }

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method)
    setStripeClientSecret(null)
    setPaymentInitialized(false)
  }

  const handlePaymentSuccess = () => {
    router.push(`/orders/${order._id}`)
  }

  if (loading || !order) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center pt-[100px]">
          Loading...
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl pt-[100px]">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Delivery Method */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryMethod === 'pickup'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="mr-2"
                  />
                  Pickup from Rigger
                </Label>
                <Label>
                  <input
                    type="radio"
                    name="delivery"
                    value="shipping"
                    checked={deliveryMethod === 'shipping'}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="mr-2"
                  />
                  Ship to Address
                </Label>
              </div>

              {deliveryMethod === 'shipping' && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ZIP Code</Label>
                      <Input
                        value={address.zipCode}
                        onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        value={address.country}
                        onChange={(e) => setAddress({ ...address, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="mr-2"
                  />
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Credit/Debit Card</div>
                    <div className="text-sm text-gray-500">Visa, Mastercard via Stripe</div>
                  </div>
                </Label>
                <Label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="stablecoin"
                    checked={paymentMethod === 'stablecoin'}
                    onChange={(e) => handlePaymentMethodChange(e.target.value)}
                    className="mr-2"
                  />
                  <Coins className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Stablecoin</div>
                    <div className="text-sm text-gray-500">USDC/USDT via Bridge.xyz</div>
                  </div>
                </Label>
              </div>

              {/* Stripe Payment Form */}
              {paymentMethod === 'card' && stripeClientSecret && (
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                  <StripeElementsWrapper clientSecret={stripeClientSecret} onSuccess={handlePaymentSuccess} />
                </div>
              )}

              {/* Initialize payment button for card (before Stripe form) or stablecoin */}
              {paymentMethod === 'card' && !stripeClientSecret && (
                <Button onClick={initializePayment} className="w-full" size="lg" disabled={paymentInitialized}>
                  {paymentInitialized ? 'Initializing...' : 'Continue to Payment'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Listing Price</span>
                  <span>${order.pricing?.listingPrice?.toLocaleString()}</span>
                </div>
                {deliveryMethod === 'shipping' && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>${order.pricing?.shippingCost?.toLocaleString() || '50.00'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Rigger Fee (10%)</span>
                  <span>${order.pricing?.fees?.riggerFee?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee (2%)</span>
                  <span>${order.pricing?.fees?.platformFee?.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${order.pricing?.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {paymentMethod !== 'card' && (
                <Button onClick={initializePayment} className="w-full" size="lg" disabled={paymentInitialized}>
                  {paymentInitialized ? 'Processing...' : 'Complete Payment'}
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Payouts: 88% to Seller, 10% to Rigger, 2% to Platform
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </MainLayout>
  )
}

