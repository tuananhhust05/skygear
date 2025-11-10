'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'

export default function OrderDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>
  }

  if (!order) {
    return <div className="container mx-auto px-4 py-8 text-center">Order not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Order Details</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold capitalize">{order.status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Listing Price</span>
              <span>${order.pricing?.listingPrice?.toLocaleString()}</span>
            </div>
            {order.pricing?.shippingCost > 0 && (
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>${order.pricing.shippingCost.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>${order.pricing?.totalAmount?.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {order.payment && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Method:</strong> {order.payment.method}</p>
              <p><strong>Amount:</strong> ${order.payment.amount?.toLocaleString()}</p>
              {order.payment.paidAt && (
                <p><strong>Paid At:</strong> {new Date(order.payment.paidAt).toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        )}

        {order.delivery && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Method:</strong> {order.delivery.method}</p>
              {order.delivery.address && (
                <div>
                  <strong>Address:</strong>
                  <p>
                    {order.delivery.address.street}<br />
                    {order.delivery.address.city}, {order.delivery.address.state} {order.delivery.address.zipCode}
                  </p>
                </div>
              )}
              {order.delivery.trackingNumber && (
                <p><strong>Tracking Number:</strong> {order.delivery.trackingNumber}</p>
              )}
            </CardContent>
          </Card>
        )}

        {order.payouts && (
          <Card>
            <CardHeader>
              <CardTitle>Payout Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Seller Payout (88%)</span>
                <span className={order.payouts.seller.status === 'completed' ? 'text-green-600' : ''}>
                  ${order.payouts.seller.amount?.toLocaleString()} - {order.payouts.seller.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rigger Payout (10%)</span>
                <span className={order.payouts.rigger.status === 'completed' ? 'text-green-600' : ''}>
                  ${order.payouts.rigger.amount?.toLocaleString()} - {order.payouts.rigger.status}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

