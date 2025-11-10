'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUtils'
import { ImageSlideshow } from '@/components/ui/image-slideshow'
import { ArrowLeft, Package, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function SellerListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'seller') {
      router.push('/login')
      return
    }
    fetchListing()
  }, [params.id, user, authLoading, router])

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${params.id}`)
      setListing(response.data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load listing',
        variant: 'destructive',
      })
      router.push('/seller/listings')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!listing) return

    // Confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete this listing?\n\n"${listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`}"\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await api.delete(`/listings/${listing._id}`)
      toast({
        title: 'Success',
        description: 'Listing deleted successfully',
      })
      router.push('/seller/listings')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete listing',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      inspection: { label: 'Under Inspection', color: 'bg-blue-100 text-blue-800', icon: Clock },
      listed: { label: 'Listed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      sold: { label: 'Sold', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle },
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  if (authLoading || loading) {
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

  if (!user || user.role !== 'seller') {
    return null
  }

  if (!listing) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-gray-600">Listing not found</p>
            <Link href="/seller/listings">
              <Button className="mt-4">Back to Listings</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  const statusBadge = getStatusBadge(listing.status)
  const StatusIcon = statusBadge.icon

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Link href="/seller/listings">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Listings
              </Button>
            </Link>
            <div className="flex items-start justify-between">
              <div>
                <h1 style={{marginBottom: '30px'}}className="text-5xl font-bold mb-2 text-gray-900">
                  {listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 ${statusBadge.color}`}>
                    <StatusIcon className="h-4 w-4" />
                    {statusBadge.label}
                  </span>
                  {listing.status === 'listed' && (
                    <Link href={`/listings/${listing._id}`}>
                      <Button variant="outline" size="sm">
                        View Public Listing
                      </Button>
                    </Link>
                  )}
                  {listing.status !== 'sold' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-500"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Listing
                    </Button>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">
                  {listing.pricing?.listingPrice ? 'Listing Price' : 'Desired Price'}
                </p>
                <p className="text-4xl font-bold text-blue-600">
                  ${listing.pricing?.listingPrice?.toLocaleString() || listing.pricing?.desiredPrice?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Images */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Product Images</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.images?.fullRigView && (
                    Array.isArray(listing.images.fullRigView) && listing.images.fullRigView.length > 0 ? (
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Full Rig View</Label>
                        <ImageSlideshow 
                          images={listing.images.fullRigView} 
                          alt="Full Rig View"
                        />
                      </div>
                    ) : typeof listing.images.fullRigView === 'string' ? (
                      // Backward compatibility: single image as string
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Full Rig View</Label>
                        <div className="relative h-96 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                          <Image
                            src={getImageUrl(listing.images.fullRigView) || ''}
                            alt="Full Rig View"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    ) : null
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    {listing.images?.serialNumber ? (
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Serial Number Photo</Label>
                        <div className="relative h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                          <Image
                            src={getImageUrl(listing.images.serialNumber) || ''}
                            alt="Serial Number"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    ) : null}
                    {listing.images?.reservePackingSheet ? (
                      <div>
                        <Label className="text-base font-semibold mb-2 block">Reserve Packing Sheet</Label>
                        <div className="relative h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                          <Image
                            src={getImageUrl(listing.images.reservePackingSheet) || ''}
                            alt="Reserve Packing Sheet"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {!listing.images?.fullRigView && !listing.images?.serialNumber && !listing.images?.reservePackingSheet && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">No images available for this listing</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Rig Details */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Package className="h-6 w-6" />
                    Rig Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {listing.rigDetails?.manufacturer && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Manufacturer</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails.manufacturer}</p>
                      </div>
                    )}
                    {listing.rigDetails?.model && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Model</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails.model}</p>
                      </div>
                    )}
                    {listing.rigDetails?.size && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Size</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails.size}</p>
                      </div>
                    )}
                    {listing.rigDetails?.serialNumber && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails.serialNumber}</p>
                      </div>
                    )}
                    {listing.rigDetails?.jumpCount !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Jump Count</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails.jumpCount.toLocaleString()}</p>
                      </div>
                    )}
                    {listing.rigDetails?.year && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Year</p>
                        <p className="font-semibold text-gray-900">{listing.rigDetails.year}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Canopy */}
              {listing.canopy && (listing.canopy.manufacturer || listing.canopy.model) && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Canopy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {listing.canopy.manufacturer && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Manufacturer</p>
                          <p className="font-semibold text-gray-900">{listing.canopy.manufacturer}</p>
                        </div>
                      )}
                      {listing.canopy.model && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Model</p>
                          <p className="font-semibold text-gray-900">{listing.canopy.model}</p>
                        </div>
                      )}
                      {listing.canopy.size && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Size</p>
                          <p className="font-semibold text-gray-900">{listing.canopy.size}</p>
                        </div>
                      )}
                      {listing.canopy.cellCount && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Cell Count</p>
                          <p className="font-semibold text-gray-900">{listing.canopy.cellCount}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reserve */}
              {listing.reserve && (listing.reserve.manufacturer || listing.reserve.model) && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Reserve</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {listing.reserve.manufacturer && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Manufacturer</p>
                          <p className="font-semibold text-gray-900">{listing.reserve.manufacturer}</p>
                        </div>
                      )}
                      {listing.reserve.model && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Model</p>
                          <p className="font-semibold text-gray-900">{listing.reserve.model}</p>
                        </div>
                      )}
                      {listing.reserve.size && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Size</p>
                          <p className="font-semibold text-gray-900">{listing.reserve.size}</p>
                        </div>
                      )}
                      {listing.reserve.lastRepackDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Last Repack Date</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(listing.reserve.lastRepackDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AAD */}
              {listing.aad && (listing.aad.aadType || listing.aad.model) && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">AAD</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {listing.aad.aadType && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Type</p>
                          <p className="font-semibold text-gray-900">{listing.aad.aadType}</p>
                        </div>
                      )}
                      {listing.aad.model && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Model</p>
                          <p className="font-semibold text-gray-900">{listing.aad.model}</p>
                        </div>
                      )}
                      {listing.aad.status && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Status</p>
                          <p className="font-semibold text-gray-900 capitalize">{listing.aad.status}</p>
                        </div>
                      )}
                      {listing.aad.lastServiceDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Last Service Date</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(listing.aad.lastServiceDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {listing.aad.nextServiceDue && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Next Service Due</p>
                          <p className="font-semibold text-gray-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(listing.aad.nextServiceDue).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Inspection Report */}
              {listing.inspectionReport && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Inspection Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {listing.inspectionReport.condition && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Condition</p>
                        <p className="font-semibold text-gray-900 capitalize">{listing.inspectionReport.condition.replace('_', ' ')}</p>
                      </div>
                    )}
                    {listing.inspectionReport.inspectorName && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Inspector</p>
                        <p className="font-semibold text-gray-900">{listing.inspectionReport.inspectorName}</p>
                      </div>
                    )}
                    {listing.inspectionReport.inspectionDate && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Inspection Date</p>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(listing.inspectionReport.inspectionDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {listing.inspectionReport.riggerNotes && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Notes</p>
                        <p className="text-gray-900 whitespace-pre-wrap">{listing.inspectionReport.riggerNotes}</p>
                      </div>
                    )}
                    {listing.inspectionReport.recommendedServices && listing.inspectionReport.recommendedServices.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Recommended Services</p>
                        <ul className="space-y-2">
                          {listing.inspectionReport.recommendedServices.map((service: any, idx: number) => (
                            <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-semibold text-gray-900">{service.service}</p>
                                {service.description && (
                                  <p className="text-sm text-gray-600">{service.description}</p>
                                )}
                              </div>
                              {service.cost && (
                                <p className="font-semibold text-blue-600">${service.cost.toLocaleString()}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Rigger Info */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl">Rigger Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="font-semibold text-gray-900">
                        {listing.rigger?.profile?.firstName} {listing.rigger?.profile?.lastName}
                      </p>
                    </div>
                    {listing.rigger?.riggerInfo?.shopName && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Shop</p>
                        <p className="font-semibold text-gray-900">{listing.rigger.riggerInfo.shopName}</p>
                      </div>
                    )}
                    {listing.rigger?.email && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-semibold text-gray-900">{listing.rigger.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Listing Info */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-xl">Listing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {listing.listingInfo?.publishedAt && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Published</p>
                      <p className="font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(listing.listingInfo.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {listing.listingInfo?.views !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Views</p>
                      <p className="font-semibold text-gray-900">{listing.listingInfo.views}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Breakdown */}
              {listing.pricing && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {listing.pricing.desiredPrice && (
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-500">Desired Price</p>
                        <p className="font-semibold text-gray-900">${listing.pricing.desiredPrice.toLocaleString()}</p>
                      </div>
                    )}
                    {listing.pricing.listingPrice && (
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-500">Listing Price</p>
                        <p className="font-semibold text-blue-600">${listing.pricing.listingPrice.toLocaleString()}</p>
                      </div>
                    )}
                    {listing.pricing.fees && (
                      <>
                        {listing.pricing.fees.riggerFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <p className="text-gray-500">Rigger Fee (10%)</p>
                            <p className="text-gray-900">${listing.pricing.fees.riggerFee.toLocaleString()}</p>
                          </div>
                        )}
                        {listing.pricing.fees.platformFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <p className="text-gray-500">Platform Fee (5%)</p>
                            <p className="text-gray-900">${listing.pricing.fees.platformFee.toLocaleString()}</p>
                          </div>
                        )}
                        {listing.pricing.fees.sellerAmount && (
                          <div className="pt-3 border-t flex justify-between">
                            <p className="font-semibold text-gray-900">Your Earnings</p>
                            <p className="font-semibold text-green-600">${listing.pricing.fees.sellerAmount.toLocaleString()}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

