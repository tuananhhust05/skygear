'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { MainLayout } from '@/components/layout/MainLayout'
import { Package } from 'lucide-react'
import api from '@/lib/api'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import { ImageSlideshow } from '@/components/ui/image-slideshow'
import Link from 'next/link'

export default function RiggerDashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [listings, setListings] = useState([])
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const [inspectionData, setInspectionData] = useState({
    riggerNotes: '',
    condition: 'good',
    recommendedServices: [],
    listingPrice: '',
    title: '',
    description: '',
  })

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return
    }

    // Only redirect if auth is done loading and user is null or not a rigger
    if (!user || user.role !== 'rigger') {
      router.push('/login')
      return
    }
    fetchIncomingRigs()
  }, [user, authLoading, router])

  const fetchIncomingRigs = async () => {
    if (!user) return
    try {
      const response = await api.get(`/riggers/${user.id}/incoming`)
      setListings(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load incoming rigs',
        variant: 'destructive',
      })
    }
  }

  const handleInspect = (listing: any) => {
    setSelectedListing(listing)
    setInspectionData({
      riggerNotes: '',
      condition: 'good',
      recommendedServices: [],
      listingPrice: listing.pricing?.desiredPrice?.toString() || '',
      title: `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`,
      description: '',
    })
  }

  const handleSubmitInspection = async () => {
    if (!user || !selectedListing) return
    try {
      await api.put(`/riggers/${user.id}/listings/${selectedListing._id}/inspect`, {
        inspectionReport: {
          riggerNotes: inspectionData.riggerNotes,
          condition: inspectionData.condition,
          recommendedServices: inspectionData.recommendedServices,
        },
        listingPrice: parseFloat(inspectionData.listingPrice),
        title: inspectionData.title,
        description: inspectionData.description,
      })
      toast({
        title: 'Success',
        description: 'Inspection completed and listing published',
      })
      setSelectedListing(null)
      fetchIncomingRigs()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit inspection',
        variant: 'destructive',
      })
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
  if (!user || user.role !== 'rigger') {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Rigger Dashboard</h1>
            <p className="text-xl text-gray-600">Inspect and list incoming rigs</p>
          </div>

          {selectedListing ? (
        <div className="space-y-6">
          <Card className="border-0 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl">Product Images</CardTitle>
              <CardDescription className="text-base">Review the images submitted by the seller</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {selectedListing.images?.fullRigView && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Full Rig View</Label>
                    {Array.isArray(selectedListing.images.fullRigView) && selectedListing.images.fullRigView.length > 0 ? (
                      <ImageSlideshow 
                        images={selectedListing.images.fullRigView} 
                        alt="Full Rig View"
                      />
                    ) : typeof selectedListing.images.fullRigView === 'string' ? (
                      // Backward compatibility: single image as string
                      <div className="relative h-96 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                        <Image
                          src={getImageUrl(selectedListing.images.fullRigView) || ''}
                          alt="Full Rig View"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedListing.images?.serialNumber && (
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Serial Number Photo</Label>
                      <div className="relative h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                        <Image
                          src={getImageUrl(selectedListing.images.serialNumber) || ''}
                          alt="Serial Number"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  {selectedListing.images?.reservePackingSheet && (
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Reserve Packing Sheet</Label>
                      <div className="relative h-64 w-full rounded-xl overflow-hidden border-2 border-gray-200">
                        <Image
                          src={getImageUrl(selectedListing.images.reservePackingSheet) || ''}
                          alt="Reserve Packing Sheet"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
                {!selectedListing.images?.fullRigView && !selectedListing.images?.serialNumber && !selectedListing.images?.reservePackingSheet && (
                  <p className="text-gray-500 text-center py-8">No images available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rig Information Summary */}
          <Card className="border-0 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl">Rig Information</CardTitle>
              <CardDescription className="text-base">Details provided by the seller</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Manufacturer</p>
                    <p className="font-semibold text-gray-900">{selectedListing.rigDetails?.manufacturer || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Model</p>
                    <p className="font-semibold text-gray-900">{selectedListing.rigDetails?.model || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Size</p>
                    <p className="font-semibold text-gray-900">{selectedListing.rigDetails?.size || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                    <p className="font-semibold text-gray-900">{selectedListing.rigDetails?.serialNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Jump Count</p>
                    <p className="font-semibold text-gray-900">{selectedListing.rigDetails?.jumpCount?.toLocaleString() || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Year</p>
                    <p className="font-semibold text-gray-900">{selectedListing.rigDetails?.year || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Desired Price</p>
                    <p className="font-semibold text-blue-600 text-lg">
                      ${selectedListing.pricing?.desiredPrice?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  {selectedListing.canopy && (selectedListing.canopy.manufacturer || selectedListing.canopy.model) && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Canopy</p>
                      <p className="font-semibold text-gray-900">
                        {selectedListing.canopy.manufacturer} {selectedListing.canopy.model}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl">Inspect & List Rig</CardTitle>
              <CardDescription className="text-base">Review the rig and create the listing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Listing Title</Label>
              <Input
                value={inspectionData.title}
                onChange={(e) => setInspectionData({ ...inspectionData, title: e.target.value })}
                className="h-12 rounded-xl border-2 focus:border-blue-500"
                placeholder="e.g., UPT Vector 3 - Excellent Condition"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Description</Label>
              <textarea
                value={inspectionData.description}
                onChange={(e) => setInspectionData({ ...inspectionData, description: e.target.value })}
                className="flex min-h-[120px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                rows={4}
                placeholder="Describe the rig's condition, features, and any notable details..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-semibold">Listing Price ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={inspectionData.listingPrice}
                  onChange={(e) => setInspectionData({ ...inspectionData, listingPrice: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold">Condition</Label>
                <select
                  value={inspectionData.condition}
                  onChange={(e) => setInspectionData({ ...inspectionData, condition: e.target.value })}
                  className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Inspection Notes</Label>
              <textarea
                value={inspectionData.riggerNotes}
                onChange={(e) => setInspectionData({ ...inspectionData, riggerNotes: e.target.value })}
                className="flex min-h-[180px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                rows={8}
                placeholder="Detailed inspection notes including rig details, canopy info, AAD status, last repack date, recommended services and associated costs..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleSubmitInspection} 
                className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/30"
              >
                Publish Listing
              </Button>
              <Button 
                onClick={() => setSelectedListing(null)} 
                variant="outline"
                className="h-14 rounded-xl border-2 text-lg"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Incoming Rigs for Inspection</h2>
            <p className="text-lg text-gray-600">Review and inspect rigs submitted by sellers</p>
          </div>
          {listings.length === 0 ? (
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-medium">No incoming rigs at this time</p>
                <p className="text-gray-500 mt-2">New rigs submitted by sellers will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {listings.map((listing: any) => (
                <Card key={listing._id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">
                      {listing.rigDetails?.manufacturer} {listing.rigDetails?.model}
                    </CardTitle>
                    <CardDescription className="text-base">
                      From: {listing.seller?.profile?.firstName} {listing.seller?.profile?.lastName}
                      {listing.seller?.email && ` (${listing.seller.email})`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Size</p>
                          <p className="font-semibold text-gray-900">{listing.rigDetails?.size || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Serial Number</p>
                          <p className="font-semibold text-gray-900">{listing.rigDetails?.serialNumber || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Jump Count</p>
                          <p className="font-semibold text-gray-900">{listing.rigDetails?.jumpCount?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Desired Price</p>
                          <p className="font-semibold text-blue-600 text-lg">
                            ${listing.pricing?.desiredPrice?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleInspect(listing)}
                      className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-blue-500/30"
                    >
                      Inspect & List
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
        </div>
      </div>
    </MainLayout>
  )
}

