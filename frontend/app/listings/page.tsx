'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MainLayout } from '@/components/layout/MainLayout'
import api from '@/lib/api'
import { Search, MessageCircle, Filter, X, ChevronDown, ChevronUp, Image as ImageIcon, Upload } from 'lucide-react'

export default function ListingsPage() {
  const [listings, setListings] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [imageSearchLoading, setImageSearchLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Filter states
  const [filters, setFilters] = useState({
    manufacturer: '',
    model: '',
    size: '',
    serialNumber: '',
    jumpCount: '',
    year: '',
    price: ''
  })

  useEffect(() => {
    // Don't fetch if image search is active
    if (imagePreview !== null) {
      return
    }
    
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchListings()
    }, 300) // Wait 300ms after user stops typing

    return () => clearTimeout(timeoutId)
  }, [search, filters, imagePreview])

  const fetchListings = async () => {
    try {
      setLoading(true)
      const params: any = {}
      
      // Add general search if exists
      if (search) {
        params.search = search
      }
      
      // Add specific filters (only non-empty values)
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params[key] = value.trim()
        }
      })
      
      const response = await api.get('/listings', { params })
      setListings(response.data)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetFilters = () => {
    setSearch('')
    setImagePreview(null)
    setFilters({
      manufacturer: '',
      model: '',
      size: '',
      serialNumber: '',
      jumpCount: '',
      year: '',
      price: ''
    })
    fetchListings()
  }

  const hasActiveFilters = () => {
    return search.trim() !== '' || Object.values(filters).some(v => v.trim() !== '') || imagePreview !== null
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Convert to base64 and search
    try {
      setImageSearchLoading(true)
      const base64Reader = new FileReader()
      base64Reader.onloadend = async () => {
        try {
          const base64 = (base64Reader.result as string).split(',')[1] // Remove data URL prefix
          
          setLoading(true)
          const response = await api.post('/listings/search-by-image', {
            image: base64
          })
          
          setListings(response.data)
          setLoading(false)
          setSearch('') // Clear text search
          setFilters({
            manufacturer: '',
            model: '',
            size: '',
            serialNumber: '',
            jumpCount: '',
            year: '',
            price: ''
          })
        } catch (error) {
          console.error('Image search failed:', error)
          alert('Failed to search by image. Please try again.')
          setImagePreview(null) // Clear preview on error
        } finally {
          setImageSearchLoading(false)
          setLoading(false)
        }
      }
      base64Reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing image:', error)
      setImageSearchLoading(false)
    }
  }

  const clearImageSearch = () => {
    setImagePreview(null)
    setLoading(true)
    // Reset to normal search
    fetchListings()
  }

  const openChat = (rigger: any) => {
    const phone = rigger.profile?.phone || ''
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Browse Rigs</h1>
            <p className="text-xl text-gray-600 mb-8">Find your perfect skydiving gear</p>
            
            {/* Search Bar */}
            <div className="flex gap-4 mb-4 flex-wrap">
              <div className="relative flex-1 max-w-2xl min-w-[300px]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by manufacturer, model, or canopy..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={imagePreview !== null}
                  className="pl-12 h-14 text-lg rounded-2xl border-2 border-gray-200 focus:border-blue-500 bg-white disabled:opacity-50"
                />
              </div>
              
              {/* Image Search */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-search-input"
                  disabled={imageSearchLoading}
                />
                <Button
                  variant="outline"
                  className="h-14 px-6 rounded-2xl border-2"
                  onClick={() => document.getElementById('image-search-input')?.click()}
                  disabled={imageSearchLoading}
                >
                  {imageSearchLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-5 w-5 mr-2" />
                
                    </>
                  )}
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="h-14 px-6 rounded-2xl border-2"
                onClick={() => setShowFilters(!showFilters)}
                disabled={imagePreview !== null}
              >
                <Filter className="h-5 w-5 mr-2" />
                Filters
                {showFilters ? (
                  <ChevronUp className="h-5 w-5 ml-2" />
                ) : (
                  <ChevronDown className="h-5 w-5 ml-2" />
                )}
              </Button>
              {hasActiveFilters() && (
                <Button 
                  variant="outline" 
                  className="h-14 px-6 rounded-2xl border-2 text-red-600 hover:text-red-700 hover:border-red-300"
                  onClick={resetFilters}
                >
                  <X className="h-5 w-5 mr-2" />
                  Clear
                </Button>
              )}
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-4 p-4 bg-white rounded-xl border-2 border-blue-200 flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img src={imagePreview} alt="Search preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Searching by image</p>
                  <p className="text-xs text-gray-500">Results sorted by similarity</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearImageSearch}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="p-6 mb-6 bg-white border-2 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      placeholder="e.g. UPT, Icarus"
                      value={filters.manufacturer}
                      onChange={(e) => handleFilterChange('manufacturer', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      placeholder="e.g. Vector, Javelin"
                      value={filters.model}
                      onChange={(e) => handleFilterChange('model', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input
                      id="size"
                      placeholder="e.g. M, L, XL"
                      value={filters.size}
                      onChange={(e) => handleFilterChange('size', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      placeholder="Enter serial number"
                      value={filters.serialNumber}
                      onChange={(e) => handleFilterChange('serialNumber', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jumpCount">Jump Count</Label>
                    <Input
                      id="jumpCount"
                      type="number"
                      placeholder="e.g. 500"
                      value={filters.jumpCount}
                      onChange={(e) => handleFilterChange('jumpCount', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      type="number"
                      placeholder="e.g. 2020"
                      value={filters.year}
                      onChange={(e) => handleFilterChange('year', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="e.g. 5000"
                      value={filters.price}
                      onChange={(e) => handleFilterChange('price', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {loading ? (
            <div className="text-center py-24">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
              <p className="mt-4 text-gray-600">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing: any) => (
                <Card 
                  key={listing._id} 
                  className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer"
                >
                  <Link href={`/listings/${listing._id}`}>
                    {listing.images?.fullRigView && (
                      <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                        {Array.isArray(listing.images.fullRigView) && listing.images.fullRigView.length > 0 ? (
                          <Image
                            src={getImageUrl(listing.images.fullRigView[0]) || ''}
                            alt={listing.listingInfo?.title || 'Rig'}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : typeof listing.images.fullRigView === 'string' ? (
                          <Image
                            src={getImageUrl(listing.images.fullRigView) || ''}
                            alt={listing.listingInfo?.title || 'Rig'}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : null}
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
                      <div className="space-y-3 mb-4">
                        <p className="text-3xl font-bold text-gray-900">
                          ${listing.pricing?.listingPrice?.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Inspected by {listing.rigger?.profile?.firstName} {listing.rigger?.profile?.lastName}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-xl border-2"
                          onClick={(e) => {
                            e.preventDefault()
                            openChat(listing.rigger)
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

