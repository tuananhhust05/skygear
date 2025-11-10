'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUtils'
import { ImageSlideshow } from '@/components/ui/image-slideshow'
import { MainLayout } from '@/components/layout/MainLayout'
import { MessageCircle, ShoppingCart } from 'lucide-react'

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchListing()
  }, [params.id])

  const fetchListing = async () => {
    try {
      const response = await api.get(`/listings/${params.id}`)
      setListing(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load listing',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const response = await api.post('/orders', {
        listingId: listing._id,
        delivery: {
          method: 'pickup', // TODO: Add delivery selection
        },
      })
      router.push(`/checkout/${response.data._id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create order',
        variant: 'destructive',
      })
    }
  }

  const openChat = () => {
    const phone = listing.rigger?.profile?.phone || ''
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center pt-[100px]">
          Loading...
        </div>
      </MainLayout>
    )
  }

  if (!listing) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8 text-center pt-[100px]">
          Listing not found
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 pt-[100px]">
        <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          {listing.images?.fullRigView && (
            Array.isArray(listing.images.fullRigView) && listing.images.fullRigView.length > 0 ? (
              <ImageSlideshow 
                images={listing.images.fullRigView} 
                alt="Full Rig View"
                className="mb-4"
              />
            ) : typeof listing.images.fullRigView === 'string' ? (
              // Backward compatibility: single image as string
              <div className="relative h-96 w-full">
                <Image
                  src={getImageUrl(listing.images.fullRigView) || ''}
                  alt="Full Rig View"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ) : null
          )}
          <div className="grid grid-cols-3 gap-2">
            {listing.images?.serialNumber && (
              <div className="relative h-24 w-full">
                <Image
                  src={getImageUrl(listing.images.serialNumber) || ''}
                  alt="Serial Number"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            {listing.images?.reservePackingSheet && (
              <div className="relative h-24 w-full">
                <Image
                  src={getImageUrl(listing.images.reservePackingSheet) || ''}
                  alt="Reserve Packing Sheet"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`}
            </h1>
            <p className="text-3xl font-bold text-primary">
              ${listing.pricing?.listingPrice?.toLocaleString()}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rig Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Manufacturer:</strong> {listing.rigDetails?.manufacturer}</p>
              <p><strong>Model:</strong> {listing.rigDetails?.model}</p>
              <p><strong>Size:</strong> {listing.rigDetails?.size}</p>
              <p><strong>Serial Number:</strong> {listing.rigDetails?.serialNumber}</p>
              <p><strong>Jump Count:</strong> {listing.rigDetails?.jumpCount}</p>
              <p><strong>Year:</strong> {listing.rigDetails?.year}</p>
            </CardContent>
          </Card>

          {listing.canopy && (
            <Card>
              <CardHeader>
                <CardTitle>Canopy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Manufacturer:</strong> {listing.canopy.manufacturer}</p>
                <p><strong>Model:</strong> {listing.canopy.model}</p>
                <p><strong>Size:</strong> {listing.canopy.size}</p>
                <p><strong>Cell Count:</strong> {listing.canopy.cellCount}</p>
              </CardContent>
            </Card>
          )}

          {listing.reserve && (
            <Card>
              <CardHeader>
                <CardTitle>Reserve</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Manufacturer:</strong> {listing.reserve.manufacturer}</p>
                <p><strong>Model:</strong> {listing.reserve.model}</p>
                <p><strong>Size:</strong> {listing.reserve.size}</p>
                {listing.reserve.lastRepackDate && (
                  <p><strong>Last Repack:</strong> {new Date(listing.reserve.lastRepackDate).toLocaleDateString()}</p>
                )}
              </CardContent>
            </Card>
          )}

          {listing.inspectionReport && (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Report</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2"><strong>Condition:</strong> {listing.inspectionReport.condition}</p>
                <p className="mb-2"><strong>Inspector:</strong> {listing.inspectionReport.inspectorName}</p>
                {listing.inspectionReport.riggerNotes && (
                  <div>
                    <strong>Notes:</strong>
                    <p className="mt-1">{listing.inspectionReport.riggerNotes}</p>
                  </div>
                )}
                {listing.inspectionReport.recommendedServices?.length > 0 && (
                  <div className="mt-4">
                    <strong>Recommended Services:</strong>
                    <ul className="list-disc list-inside mt-2">
                      {listing.inspectionReport.recommendedServices.map((service: any, idx: number) => (
                        <li key={idx}>{service.service} - ${service.cost}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button onClick={handleCheckout} className="flex-1" size="lg">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Proceed to Checkout
            </Button>
            <Button onClick={openChat} variant="outline" size="lg">
              <MessageCircle className="mr-2 h-4 w-4" />
              Contact Rigger
            </Button>
          </div>
        </div>
        </div>
      </div>
    </MainLayout>
  )
}

