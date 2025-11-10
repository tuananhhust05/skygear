'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MainLayout } from '@/components/layout/MainLayout'
import { 
  PlusCircle, 
  List, 
  CheckSquare, 
  ShoppingBag, 
  Search, 
  ArrowRight,
  Package,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

interface DashboardStats {
  // Seller stats
  totalListings?: number
  pendingListings?: number
  activeListings?: number
  soldListings?: number
  totalEarnings?: number
  pendingOrders?: number
  
  // Rigger stats
  pendingInspections?: number
  completedOrders?: number
  
  // Buyer stats
  totalOrders?: number
  buyerPendingOrders?: number
  buyerCompletedOrders?: number
  totalSpent?: number
}

interface Activity {
  type: string
  id: string
  title: string
  status: string
  date: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({})
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, authLoading, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity')
      ])
      setStats(statsRes.data)
      setActivities(activityRes.data)
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-8 py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'text-yellow-600 bg-yellow-50',
      inspection: 'text-blue-600 bg-blue-50',
      listed: 'text-green-600 bg-green-50',
      sold: 'text-purple-600 bg-purple-50',
      paid: 'text-blue-600 bg-blue-50',
      shipped: 'text-cyan-600 bg-cyan-50',
      delivered: 'text-green-600 bg-green-50',
      completed: 'text-green-600 bg-green-50',
      cancelled: 'text-red-600 bg-red-50',
    }
    return statusColors[status] || 'text-gray-600 bg-gray-50'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'completed' || status === 'delivered' || status === 'sold') {
      return <CheckCircle className="h-4 w-4" />
    }
    if (status === 'pending' || status === 'inspection') {
      return <Clock className="h-4 w-4" />
    }
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Dashboard</h1>
            <p className="text-xl text-gray-600">
              Welcome back, {user.profile?.firstName || user.email}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {user.role === 'seller' && (
              <>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.totalListings || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Total Listings</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.pendingListings || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Pending Inspection</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.activeListings || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Active Listings</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {formatCurrency(stats.totalEarnings || 0)}
                    </CardTitle>
                    <CardDescription className="text-base">Total Earnings</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}

            {user.role === 'rigger' && (
              <>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.totalListings || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Total Listings</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.pendingInspections || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Pending Inspections</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.completedOrders || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Completed Orders</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {formatCurrency(stats.totalEarnings || 0)}
                    </CardTitle>
                    <CardDescription className="text-base">Total Earnings</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}

            {user.role === 'buyer' && (
              <>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.totalOrders || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Total Orders</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.buyerPendingOrders || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Pending Orders</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {stats.buyerCompletedOrders || 0}
                    </CardTitle>
                    <CardDescription className="text-base">Completed Orders</CardDescription>
                  </CardHeader>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <CardTitle className="text-3xl font-bold mt-4">
                      {formatCurrency(stats.totalSpent || 0)}
                    </CardTitle>
                    <CardDescription className="text-base">Total Spent</CardDescription>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {user.role === 'seller' && (
              <>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <PlusCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl">Submit Rig</CardTitle>
                    <CardDescription className="text-base">List your rig for sale</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/seller/submit">
                      <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11">
                        Submit New Rig
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
                      <List className="h-6 w-6 text-cyan-600" />
                    </div>
                    <CardTitle className="text-xl">My Listings</CardTitle>
                    <CardDescription className="text-base">View your submitted rigs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/seller/listings">
                      <Button className="w-full rounded-xl h-11 border-2" variant="outline">
                        View Listings
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}

            {user.role === 'rigger' && (
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                    <CheckSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Inspect Rigs</CardTitle>
                  <CardDescription className="text-base">Review and list incoming rigs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/rigger/dashboard">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11">
                      View Incoming Rigs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {user.role === 'buyer' && (
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                    <ShoppingBag className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">My Orders</CardTitle>
                  <CardDescription className="text-base">Track your purchases</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/orders">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-11">
                      View Orders
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Browse All Listings</CardTitle>
                <CardDescription className="text-base">View all available rigs</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/listings">
                  <Button className="w-full rounded-xl h-11 border-2" variant="outline">
                    Browse Rigs
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          {activities.length > 0 && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Recent Activity</CardTitle>
                <CardDescription>Your latest listings and orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                          {getStatusIcon(activity.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-500 capitalize">{activity.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                        <Link
                          href={activity.type === 'order' ? `/orders/${activity.id}` : `/listings/${activity.id}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
