'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUtils'

export function FeaturedListings() {
  const [listings, setListings] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedListings()
  }, [])

  const fetchFeaturedListings = async () => {
    try {
      const response = await api.get('/listings', {
        params: { featured: 'true', limit: '10' }
      })
      setListings(response.data)
    } catch (error) {
      console.error('Failed to fetch featured listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    if (listings.length <= 3) return
    setCurrentIndex((prev) => {
      const maxIndex = listings.length - 3
      return (prev + 1) % (maxIndex + 1)
    })
  }

  const prevSlide = () => {
    if (listings.length <= 3) return
    setCurrentIndex((prev) => {
      const maxIndex = listings.length - 3
      return (prev - 1 + maxIndex + 1) % (maxIndex + 1)
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (listings.length === 0) {
    return null
  }

  const itemsToShow = Math.min(3, listings.length)
  const visibleListings = listings.slice(currentIndex, currentIndex + itemsToShow)
  
  // Pad with empty items if needed for layout
  while (visibleListings.length < 3 && visibleListings.length < listings.length) {
    visibleListings.push(null as any)
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Featured Rigs</h2>
          <p className="text-xl text-gray-600">Handpicked selections from our verified riggers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={listings.length <= 3}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={listings.length <= 3}
            className="rounded-full"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {visibleListings.map((listing: any, index: number) => {
          if (!listing) return <div key={`empty-${index}`}></div>
          return (
          <Link key={listing._id} href={`/listings/${listing._id}`}>
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer overflow-hidden">
              {listing.images?.fullRigView && (
                <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={getImageUrl(listing.images.fullRigView) || ''}
                    alt={listing.listingInfo?.title || 'Rig'}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-xl line-clamp-1 group-hover:text-blue-600 transition-colors">
                  {listing.listingInfo?.title || `${listing.rigDetails?.manufacturer} ${listing.rigDetails?.model}`}
                </CardTitle>
                <CardDescription className="text-base">
                  {listing.rigDetails?.size} • {listing.rigDetails?.jumpCount} jumps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">
                    ${listing.pricing?.listingPrice?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Inspected by {listing.rigger?.profile?.firstName} {listing.rigger?.profile?.lastName}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          )
        })}
      </div>
    </div>
  )
}

