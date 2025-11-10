'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import { 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  ShoppingBag,
  DollarSign,
  MessageCircle,
  Package
} from 'lucide-react'
import Link from 'next/link'

export default function BuyerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [buyer, setBuyer] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchBuyerData()
      fetchRecentOrders()
    }
  }, [params.id])

  const fetchBuyerData = async () => {
    try {
      const response = await api.get(`/users/buyer/${params.id}/public`)
      setBuyer(response.data.user)
      setStats(response.data.stats)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load buyer information',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentOrders = async () => {
    // Only fetch if user is viewing their own profile or is admin
    if (user && (user.id === params.id || user.role === 'admin')) {
      try {
        const response = await api.get(`/orders/user/mine`)
        setRecentOrders(response.data.slice(0, 6))
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!buyer) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <Card className="border-0 shadow-xl rounded-3xl p-8">
            <CardContent className="text-center">
              <p className="text-xl text-gray-600">Buyer not found</p>
              <Link href="/listings">
                <Button className="mt-4">Browse Listings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {buyer.profile?.avatar ? (
                  <Image
                    src={getImageUrl(buyer.profile.avatar) || ''}
                    alt={buyer.profile?.firstName || 'Buyer'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-5xl font-bold">
                    {buyer.profile?.firstName?.[0] || buyer.profile?.lastName?.[0] || 'B'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-bold text-gray-900">
                    {buyer.profile?.firstName} {buyer.profile?.lastName}
                  </h1>
                  <div className="bg-purple-500 rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-xl text-gray-600 mb-4">Buyer</p>
                
                {/* Stats */}
                {stats && (
                  <div className="flex gap-6 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalOrders || 0}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.completedOrders || 0}</p>
                      <p className="text-sm text-gray-600">Completed Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        ${(stats.totalSpent || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </div>
                )}
              </div>
              {user && user.id !== buyer._id && (
                <Link href={`/chat/${buyer._id}`}>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/30">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Send Message
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Orders - Only show if user is viewing their own profile */}
              {user && user.id === params.id && recentOrders.length > 0 && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Recent Purchases</CardTitle>
                    <CardDescription>Latest orders and purchases</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentOrders.map((order: any) => (
                        <Link key={order._id} href={`/orders/${order._id}`}>
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg mb-1">
                                    {order.listing?.listingInfo?.title || 'Order'}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-blue-600">
                                    ${order.pricing?.totalAmount?.toLocaleString() || 'N/A'}
                                  </p>
                                  <p className={`text-sm font-semibold ${
                                    order.status === 'completed' ? 'text-green-600' :
                                    order.status === 'pending' ? 'text-yellow-600' :
                                    'text-gray-600'
                                  }`}>
                                    {order.status.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {buyer.profile?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-gray-600">
                          {buyer.profile.address.city && `${buyer.profile.address.city}, `}
                          {buyer.profile.address.state && `${buyer.profile.address.state} `}
                          {buyer.profile.address.country}
                        </p>
                        {buyer.profile.address.street && (
                          <p className="text-sm text-gray-500 mt-1">{buyer.profile.address.street}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {buyer.profile?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-gray-600">{buyer.profile.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <a href={`mailto:${buyer.email}`} className="text-blue-600 hover:underline">
                        {buyer.email}
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Member Since */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Member Since</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg text-gray-600">
                    {buyer.createdAt ? new Date(buyer.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    }) : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

