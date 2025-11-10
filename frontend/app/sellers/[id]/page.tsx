'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import { 
  MapPin, 
  Phone, 
  Mail,
  CheckCircle,
  Package,
  DollarSign,
  MessageCircle,
  ShoppingBag
} from 'lucide-react'
import Link from 'next/link'

export default function SellerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [seller, setSeller] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchSellerData()
      fetchListings()
    }
  }, [params.id])

  const fetchSellerData = async () => {
    try {
      const response = await api.get(`/users/seller/${params.id}/public`)
      setSeller(response.data.user)
      setStats(response.data.stats)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load seller information',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchListings = async () => {
    try {
      const response = await api.get(`/listings`, {
        params: { seller: params.id, limit: '6' }
      })
      setListings(response.data)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
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

  if (!seller) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <Card className="border-0 shadow-xl rounded-3xl p-8">
            <CardContent className="text-center">
              <p className="text-xl text-gray-600">Seller not found</p>
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
                {seller.profile?.avatar ? (
                  <Image
                    src={getImageUrl(seller.profile.avatar) || ''}
                    alt={seller.profile?.firstName || 'Seller'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-5xl font-bold">
                    {seller.profile?.firstName?.[0] || seller.profile?.lastName?.[0] || 'S'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-bold text-gray-900">
                    {seller.profile?.firstName} {seller.profile?.lastName}
                  </h1>
                  <div className="bg-blue-500 rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-xl text-gray-600 mb-4">Seller</p>
                
                {/* Stats */}
                {stats && (
                  <div className="flex gap-6 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalListings || 0}</p>
                      <p className="text-sm text-gray-600">Total Listings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.activeListings || 0}</p>
                      <p className="text-sm text-gray-600">Active Listings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.soldListings || 0}</p>
                      <p className="text-sm text-gray-600">Sold Items</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-cyan-600">
                        ${(stats.totalEarnings || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                    </div>
                  </div>
                )}
              </div>
              {user && user.id !== seller._id && (
                <Link href={`/chat/${seller._id}`}>
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
              {/* Listings */}
              {listings.length > 0 && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Active Listings</CardTitle>
                    <CardDescription>Items currently for sale</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {listings.map((listing: any) => (
                        <Link key={listing._id} href={`/listings/${listing._id}`}>
                          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl cursor-pointer overflow-hidden">
                            {listing.images?.fullRigView && (
                              <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                                {Array.isArray(listing.images.fullRigView) && listing.images.fullRigView.length > 0 ? (
                                  <Image
                                    src={getImageUrl(listing.images.fullRigView[0]) || ''}
                                    alt={listing.listingInfo?.title || 'Listing'}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : typeof listing.images.fullRigView === 'string' ? (
                                  <Image
                                    src={getImageUrl(listing.images.fullRigView) || ''}
                                    alt={listing.listingInfo?.title || 'Listing'}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                ) : null}
                              </div>
                            )}
                            <CardContent className="p-4">
                              <h3 className="font-semibold text-lg mb-2">
                                {listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`}
                              </h3>
                              <p className="text-2xl font-bold text-blue-600">
                                ${listing.pricing?.listingPrice?.toLocaleString() || 'N/A'}
                              </p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                    {listings.length >= 6 && (
                      <div className="mt-4 text-center">
                        <Link href={`/listings?seller=${seller._id}`}>
                          <Button variant="outline" className="rounded-xl">
                            View All Listings
                          </Button>
                        </Link>
                      </div>
                    )}
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
                  {seller.profile?.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-gray-600">
                          {seller.profile.address.city && `${seller.profile.address.city}, `}
                          {seller.profile.address.state && `${seller.profile.address.state} `}
                          {seller.profile.address.country}
                        </p>
                        {seller.profile.address.street && (
                          <p className="text-sm text-gray-500 mt-1">{seller.profile.address.street}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {seller.profile?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-gray-600">{seller.profile.phone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-semibold">Email</p>
                      <a href={`mailto:${seller.email}`} className="text-blue-600 hover:underline">
                        {seller.email}
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
                    {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString('en-US', { 
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

