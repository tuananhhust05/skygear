'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { MainLayout } from '@/components/layout/MainLayout'
import { PlusCircle, Eye, Trash2 } from 'lucide-react'
import api from '@/lib/api'
import Link from 'next/link'

export default function SellerListingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [listings, setListings] = useState([])

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return
    }

    // Only redirect if auth is done loading and user is null or not a seller
    if (!user || user.role !== 'seller') {
      router.push('/login')
      return
    }
    fetchListings()
  }, [user, authLoading, router])

  const fetchListings = async () => {
    try {
      const response = await api.get('/listings/seller/mine')
      setListings(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load listings',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (listingId: string, listingTitle: string) => {
    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete this listing?\n\n"${listingTitle}"\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await api.delete(`/listings/${listingId}`)
      toast({
        title: 'Success',
        description: 'Listing deleted successfully',
      })
      // Refresh listings
      fetchListings()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete listing',
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'listed':
        return 'text-green-600 bg-green-50'
      case 'sold':
        return 'text-blue-600 bg-blue-50'
      case 'pending':
      case 'inspection':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  // Show loading state while auth is checking
  if (authLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Redirect if no user after loading
  if (!user || user.role !== 'seller') {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-5xl font-bold mb-2 text-gray-900">My Listings</h1>
              <p className="text-xl text-gray-600">Manage your submitted rigs</p>
            </div>
            <Link href="/seller/submit" className="cursor-pointer">
              <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all cursor-pointer">
                <PlusCircle className="mr-2 h-5 w-5" />
                Submit New Rig
              </Button>
            </Link>
          </div>

          {listings.length === 0 ? (
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-medium mb-2">No listings yet</p>
                <p className="text-gray-500 mb-6">Start by submitting your first rig for sale</p>
                <Link href="/seller/submit" className="cursor-pointer">
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all cursor-pointer">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Submit Your First Rig
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {listings.map((listing: any) => (
                <Card key={listing._id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-3xl">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">
                          {listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`}
                        </CardTitle>
                        <CardDescription className="text-base">
                          Rigger: {listing.rigger?.profile?.firstName} {listing.rigger?.profile?.lastName}
                        </CardDescription>
                      </div>
                      <span className={`px-4 py-2 rounded-xl font-semibold text-sm ${getStatusColor(listing.status)}`}>
                        {listing.status.toUpperCase()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Size</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails?.size || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails?.serialNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          {listing.pricing?.listingPrice ? 'Listing Price' : 'Desired Price'}
                        </p>
                        <p className="font-semibold text-blue-600 text-lg">
                          ${listing.pricing?.listingPrice?.toLocaleString() || listing.pricing?.desiredPrice?.toLocaleString() || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <Link href={`/seller/listings/${listing._id}`} className="cursor-pointer">
                        <Button variant="outline" className="rounded-xl border-2 hover:bg-gray-50 hover:border-blue-500 transition-all cursor-pointer">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </Link>
                      {listing.status === 'listed' && (
                        <Link href={`/listings/${listing._id}`} className="cursor-pointer">
                          <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                            View Public Listing
                          </Button>
                        </Link>
                      )}
                      {listing.status !== 'sold' && (
                        <Button
                          variant="outline"
                          onClick={() => handleDelete(
                            listing._id,
                            listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`
                          )}
                          className="rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-500 transition-all"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

