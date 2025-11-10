'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CheckCircle, Star } from 'lucide-react'
import api from '@/lib/api'
import { getImageUrl } from '@/lib/imageUtils'

export function RiggersShowcase() {
  const [riggers, setRiggers] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRiggers()
  }, [])

  const fetchRiggers = async () => {
    try {
      const response = await api.get('/riggers')
      setRiggers(response.data)
    } catch (error) {
      console.error('Failed to fetch riggers:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextSlide = () => {
    if (riggers.length <= 3) return
    setCurrentIndex((prev) => {
      const maxIndex = riggers.length - 3
      return (prev + 1) % (maxIndex + 1)
    })
  }

  const prevSlide = () => {
    if (riggers.length <= 3) return
    setCurrentIndex((prev) => {
      const maxIndex = riggers.length - 3
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

  if (riggers.length === 0) {
    return null
  }

  const itemsToShow = Math.min(3, riggers.length)
  const visibleRiggers = riggers.slice(currentIndex, currentIndex + itemsToShow)
  
  // Pad with empty items if needed for layout
  while (visibleRiggers.length < 3 && visibleRiggers.length < riggers.length) {
    visibleRiggers.push(null as any)
  }

  return (
    <section className="py-24 bg-[#f5f5f7]">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Our Verified Riggers</h2>
            <p className="text-xl text-gray-600">Licensed professionals you can trust</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              disabled={riggers.length <= 3}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              disabled={riggers.length <= 3}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {visibleRiggers.map((rigger: any, index: number) => {
            if (!rigger) return <div key={`empty-${index}`}></div>
            return (
            <Card key={rigger._id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {rigger.profile?.avatar ? (
                      <Image
                        src={getImageUrl(rigger.profile.avatar) || ''}
                        alt={rigger.profile?.firstName || 'Rigger'}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {rigger.profile?.firstName?.[0] || rigger.profile?.lastName?.[0] || 'R'}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <CardTitle className="text-xl">
                  {rigger.profile?.firstName} {rigger.profile?.lastName}
                </CardTitle>
                <CardDescription className="text-base">
                  {rigger.riggerInfo?.shopName}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex items-center justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">5.0</span>
                </div>
                {rigger.riggerInfo?.licenseNumber && (
                  <p className="text-sm text-gray-600 mb-4">
                    License: {rigger.riggerInfo.licenseNumber}
                  </p>
                )}
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </CardContent>
            </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

