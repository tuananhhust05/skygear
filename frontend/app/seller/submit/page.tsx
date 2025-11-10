'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MainLayout } from '@/components/layout/MainLayout'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Search, X } from 'lucide-react'
import Link from 'next/link'

export default function SubmitRigPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [riggers, setRiggers] = useState([])
  const [filteredRiggers, setFilteredRiggers] = useState([])
  const [riggerSearchQuery, setRiggerSearchQuery] = useState('')
  const [showRiggerSearch, setShowRiggerSearch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    rigger: '',
    deliveryMethod: 'self_deliver',
    rigDetails: {
      manufacturer: '',
      model: '',
      size: '',
      serialNumber: '',
      jumpCount: '',
      year: '',
    },
    canopy: {
      manufacturer: '',
      model: '',
      size: '',
      cellCount: '',
    },
    reserve: {
      manufacturer: '',
      model: '',
      size: '',
      lastRepackDate: '',
    },
    aad: {
      aadType: '', // Renamed from 'type' to match backend schema
      model: '',
      lastServiceDate: '',
      nextServiceDue: '',
      status: 'active',
    },
    pricing: {
      desiredPrice: '',
    },
    images: {
      serialNumber: null as File | null,
      reservePackingSheet: null as File | null,
      fullRigView: [] as File[], // Changed to array for multiple images
    },
    imagePreviews: {
      serialNumber: '',
      reservePackingSheet: '',
      fullRigView: [] as string[], // Changed to array for multiple previews
    },
  })

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
    fetchRiggers()
  }, [user, authLoading, router])

  const fetchRiggers = async () => {
    try {
      const response = await api.get('/riggers')
      setRiggers(response.data)
      setFilteredRiggers(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load riggers',
        variant: 'destructive',
      })
    }
  }

  const handleRiggerSearch = async (query: string) => {
    setRiggerSearchQuery(query)
    
    if (!query.trim()) {
      setFilteredRiggers(riggers)
      return
    }

    try {
      const response = await api.get('/riggers/search', {
        params: { email: query }
      })
      setFilteredRiggers(response.data)
    } catch (error) {
      // Fallback to client-side filtering if API fails
      const filtered = riggers.filter((rigger: any) => 
        rigger.email?.toLowerCase().includes(query.toLowerCase()) ||
        rigger.profile?.firstName?.toLowerCase().includes(query.toLowerCase()) ||
        rigger.profile?.lastName?.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredRiggers(filtered)
    }
  }

  const handleImageSelect = (field: string, files: FileList | File | null, multiple: boolean = false) => {
    // Handle both FileList and single File
    let fileArray: File[] = []
    
    if (!files) return
    
    if (files instanceof File) {
      // Single file passed
      fileArray = [files]
    } else if (files instanceof FileList) {
      // FileList passed
      fileArray = Array.from(files)
    } else {
      return
    }
    
    if (fileArray.length === 0) return
    
    // Validate all files
    for (const file of fileArray) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please select image files only',
          variant: 'destructive',
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image size must be less than 5MB',
          variant: 'destructive',
        })
        return
      }
    }

    if (multiple && field === 'fullRigView') {
      // Handle multiple files for fullRigView
      const readers = fileArray.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            resolve(reader.result as string)
          }
          reader.readAsDataURL(file)
        })
      })

      Promise.all(readers).then(previews => {
        setFormData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            fullRigView: [...(prev.images.fullRigView || []), ...fileArray],
          },
          imagePreviews: {
            ...prev.imagePreviews,
            fullRigView: [...(prev.imagePreviews.fullRigView || []), ...previews],
          },
        }))
      })
    } else {
      // Handle single file
      const file = fileArray[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          images: {
            ...prev.images,
            [field]: file,
          },
          imagePreviews: {
            ...prev.imagePreviews,
            [field]: reader.result as string,
          },
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeFullRigViewImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        fullRigView: prev.images.fullRigView.filter((_, i) => i !== index),
      },
      imagePreviews: {
        ...prev.imagePreviews,
        fullRigView: prev.imagePreviews.fullRigView.filter((_, i) => i !== index),
      },
    }))
  }

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Required fields based on backend schema
    if (!formData.rigger || formData.rigger.trim() === '') {
      errors.push('Please select a rigger')
    }

    // Optional: Validate that at least some basic info is provided
    // (Backend doesn't require these, but it's good UX to suggest)
    const hasAnyRigInfo = 
      formData.rigDetails.manufacturer ||
      formData.rigDetails.model ||
      formData.rigDetails.serialNumber

    if (!hasAnyRigInfo) {
      errors.push('Please provide at least some rig information (manufacturer, model, or serial number)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submitting
    const validation = validateForm()
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast({
          title: 'Validation Error',
          description: error,
          variant: 'destructive',
        })
      })
      return
    }

    setLoading(true)
    try {
      // Helper function to parse number safely
      const parseNumber = (value: string) => {
        if (!value || value.trim() === '') return undefined
        const parsed = parseInt(value)
        return isNaN(parsed) ? undefined : parsed
      }

      const parseFloatNumber = (value: string) => {
        if (!value || value.trim() === '') return undefined
        const parsed = parseFloat(value)
        return isNaN(parsed) ? undefined : parsed
      }

      // Build payload with only filled fields
      // rigger is required by backend schema
      if (!formData.rigger) {
        toast({
          title: 'Validation Error',
          description: 'Rigger is required',
          variant: 'destructive',
        })
        setLoading(false)
        return
      }

      const payload: any = {
        rigger: formData.rigger, // Required field
        deliveryMethod: formData.deliveryMethod,
        rigDetails: {},
        canopy: {},
        reserve: {},
        aad: {},
        pricing: {},
        images: {},
        delivery: {
          method: formData.deliveryMethod,
        },
      }

      // Only include rigDetails fields that have values
      if (formData.rigDetails.manufacturer) payload.rigDetails.manufacturer = formData.rigDetails.manufacturer
      if (formData.rigDetails.model) payload.rigDetails.model = formData.rigDetails.model
      if (formData.rigDetails.size) payload.rigDetails.size = formData.rigDetails.size
      if (formData.rigDetails.serialNumber) payload.rigDetails.serialNumber = formData.rigDetails.serialNumber
      if (formData.rigDetails.jumpCount) {
        const jumpCount = parseNumber(formData.rigDetails.jumpCount)
        if (jumpCount !== undefined) payload.rigDetails.jumpCount = jumpCount
      }
      if (formData.rigDetails.year) {
        const year = parseNumber(formData.rigDetails.year)
        if (year !== undefined) payload.rigDetails.year = year
      }

      // Only include canopy fields that have values
      if (formData.canopy.manufacturer) payload.canopy.manufacturer = formData.canopy.manufacturer
      if (formData.canopy.model) payload.canopy.model = formData.canopy.model
      if (formData.canopy.size) payload.canopy.size = formData.canopy.size
      if (formData.canopy.cellCount) {
        const cellCount = parseNumber(formData.canopy.cellCount)
        if (cellCount !== undefined) payload.canopy.cellCount = cellCount
      }

      // Only include reserve fields that have values
      if (formData.reserve.manufacturer) payload.reserve.manufacturer = formData.reserve.manufacturer
      if (formData.reserve.model) payload.reserve.model = formData.reserve.model
      if (formData.reserve.size) payload.reserve.size = formData.reserve.size
      if (formData.reserve.lastRepackDate) {
        payload.reserve.lastRepackDate = new Date(formData.reserve.lastRepackDate)
      }

      // Only include AAD fields that have values
      if (formData.aad.aadType) payload.aad.aadType = formData.aad.aadType
      if (formData.aad.model) payload.aad.model = formData.aad.model
      if (formData.aad.status) payload.aad.status = formData.aad.status
      if (formData.aad.lastServiceDate) {
        payload.aad.lastServiceDate = new Date(formData.aad.lastServiceDate)
      }
      if (formData.aad.nextServiceDue) {
        payload.aad.nextServiceDue = new Date(formData.aad.nextServiceDue)
      }

      // Only include pricing if desiredPrice has value
      if (formData.pricing.desiredPrice) {
        const desiredPrice = parseFloatNumber(formData.pricing.desiredPrice)
        if (desiredPrice !== undefined) payload.pricing.desiredPrice = desiredPrice
      }

      // Upload images to server if they exist (upload sequentially to avoid errors)
      // Upload multiple Full Rig View images first
      if (formData.images.fullRigView && formData.images.fullRigView.length > 0) {
        try {
          const uploadPromises = formData.images.fullRigView.map(async (file: File) => {
            const uploadFormData = new FormData()
            uploadFormData.append('image', file)
            const response = await api.post('/upload/image', uploadFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            return response.data.path
          })
          payload.images.fullRigView = await Promise.all(uploadPromises)
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to upload Full Rig View images',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
      }
      
      if (formData.images.serialNumber) {
        try {
          const uploadFormData = new FormData()
          uploadFormData.append('image', formData.images.serialNumber)
          const response = await api.post('/upload/image', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          payload.images.serialNumber = response.data.path
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to upload Serial Number photo',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
      }
      if (formData.images.reservePackingSheet) {
        try {
          const uploadFormData = new FormData()
          uploadFormData.append('image', formData.images.reservePackingSheet)
          const response = await api.post('/upload/image', uploadFormData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          payload.images.reservePackingSheet = response.data.path
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to upload Reserve Packing Sheet',
            variant: 'destructive',
          })
          setLoading(false)
          return
        }
      }

      // Remove empty objects
      if (Object.keys(payload.rigDetails).length === 0) delete payload.rigDetails
      if (Object.keys(payload.canopy).length === 0) delete payload.canopy
      if (Object.keys(payload.reserve).length === 0) delete payload.reserve
      if (Object.keys(payload.aad).length === 0) delete payload.aad
      if (Object.keys(payload.pricing).length === 0) delete payload.pricing
      // Don't delete images object if it has any values - keep it even if empty to ensure structure
      if (Object.keys(payload.images).length === 0) {
        // Only delete if truly no images were uploaded
        delete payload.images
      }

      // Debug: Log payload before sending (remove in production)
      console.log('Submitting listing with images:', payload.images)

      // Create listing
      const listingResponse = await api.post('/listings', payload)
      const listingId = listingResponse.data._id || listingResponse.data.id
      console.log('✅ Listing created successfully. Listing ID:', listingId)

      // Index Full Rig View images to Elasticsearch
      if (formData.images.fullRigView && formData.images.fullRigView.length > 0) {
        console.log(`📸 Starting to index ${formData.images.fullRigView.length} Full Rig View images to Elasticsearch...`)
        const imageSearchApiUrl = process.env.NEXT_PUBLIC_IMAGE_SEARCH_API_URL || 'http://54.79.147.183:5211'
        console.log('🔗 Image Search API URL:', imageSearchApiUrl)
        
        try {
          // Helper function to convert File to base64
          const fileToBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => {
                const result = reader.result as string
                // Remove data URL prefix (data:image/...;base64,)
                const base64 = result.split(',')[1] || result
                resolve(base64)
              }
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
          }

          // Index each Full Rig View image
          const indexPromises = formData.images.fullRigView.map(async (file: File, index: number) => {
            try {
              console.log(`🔄 Processing image ${index + 1}/${formData.images.fullRigView.length}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
              
              const base64 = await fileToBase64(file)
              console.log(`✅ Converted image ${index + 1} to base64. Length: ${base64.length} characters`)
              
              const requestBody = {
                image: base64,
                rig_id: listingId
              }
              console.log(`📤 Calling POST ${imageSearchApiUrl}/index with rig_id: ${listingId}`)
              
              const response = await fetch(`${imageSearchApiUrl}/index`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
              })
              
              const responseData = await response.json()
              
              if (!response.ok) {
                console.error(`❌ Failed to index image ${index + 1}:`, response.status, responseData)
                throw new Error(`HTTP ${response.status}: ${responseData.message || 'Unknown error'}`)
              }
              
              console.log(`✅ Successfully indexed image ${index + 1}:`, responseData)
              return { success: true, index: index + 1, data: responseData }
            } catch (error) {
              console.error(`❌ Error indexing image ${index + 1}:`, error)
              return { success: false, index: index + 1, error: error instanceof Error ? error.message : String(error) }
            }
          })

          // Wait for all images to be indexed (but don't fail if some fail)
          const results = await Promise.allSettled(indexPromises)
          const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
          const failed = results.length - successful
          
          console.log(`📊 Indexing complete: ${successful} successful, ${failed} failed out of ${results.length} images`)
          
          if (failed > 0) {
            console.warn('⚠️ Some images failed to index. Check logs above for details.')
          }
        } catch (error) {
          console.error('❌ Error in image indexing process:', error)
          // Don't fail the entire submission if indexing fails
        }
      } else {
        console.log('ℹ️ No Full Rig View images to index')
      }

      toast({
        title: 'Success',
        description: 'Rig submitted successfully',
      })
      router.push('/seller/listings')
    } catch (error: any) {
      // Handle validation errors from backend
      const errorMessage = error.response?.data?.message || 'Failed to submit rig'
      
      // Check if it's a validation error (MongoDB validation)
      if (error.response?.status === 400 || errorMessage.includes('required') || errorMessage.includes('validation')) {
        toast({
          title: 'Validation Error',
          description: errorMessage,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
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
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Submit Your Rig</h1>
            <p className="text-xl text-gray-600">Fill in the details about your rig</p>
          </div>
          <Card className="border-0 shadow-xl rounded-3xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl">Rig Information</CardTitle>
              <CardDescription className="text-base">Provide all the necessary details</CardDescription>
            </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Rigger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Rigger <span className="text-red-500">*</span></Label>
                <Link href="/seller/search-riggers" className="text-sm text-blue-600 hover:underline">
                  Advanced Search
                </Link>
              </div>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search rigger by email..."
                  value={riggerSearchQuery}
                  onChange={(e) => handleRiggerSearch(e.target.value)}
                  onFocus={() => setShowRiggerSearch(true)}
                  className="pl-10 pr-10 rounded-xl"
                />
                {riggerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setRiggerSearchQuery('')
                      setFilteredRiggers(riggers)
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <select
                value={formData.rigger}
                onChange={(e) => {
                  setFormData({ ...formData, rigger: e.target.value })
                  setShowRiggerSearch(false)
                }}
                className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:border-blue-500"
                required
              >
                <option value="">Choose a rigger... *</option>
                {filteredRiggers.map((rigger: any) => (
                  <option key={rigger._id} value={rigger._id}>
                    {rigger.profile?.firstName} {rigger.profile?.lastName} - {rigger.riggerInfo?.shopName || rigger.email}
                  </option>
                ))}
              </select>
              
              {filteredRiggers.length === 0 && riggerSearchQuery && (
                <p className="text-sm text-gray-500">No riggers found. Try a different search.</p>
              )}
            </div>

            {/* Delivery Method */}
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <select
                value={formData.deliveryMethod}
                onChange={(e) => setFormData({ ...formData, deliveryMethod: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="self_deliver">Deliver Yourself</option>
                <option value="platform_shipping">Ship via Platform</option>
              </select>
            </div>

            {/* Rig Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Rig Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.rigDetails.manufacturer}
                    onChange={(e) => setFormData({
                      ...formData,
                      rigDetails: { ...formData.rigDetails, manufacturer: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={formData.rigDetails.model}
                    onChange={(e) => setFormData({
                      ...formData,
                      rigDetails: { ...formData.rigDetails, model: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    value={formData.rigDetails.size}
                    onChange={(e) => setFormData({
                      ...formData,
                      rigDetails: { ...formData.rigDetails, size: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={formData.rigDetails.serialNumber}
                    onChange={(e) => setFormData({
                      ...formData,
                      rigDetails: { ...formData.rigDetails, serialNumber: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Jump Count</Label>
                  <Input
                    type="number"
                    value={formData.rigDetails.jumpCount}
                    onChange={(e) => setFormData({
                      ...formData,
                      rigDetails: { ...formData.rigDetails, jumpCount: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={formData.rigDetails.year}
                    onChange={(e) => setFormData({
                      ...formData,
                      rigDetails: { ...formData.rigDetails, year: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Canopy */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Canopy</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.canopy.manufacturer}
                    onChange={(e) => setFormData({
                      ...formData,
                      canopy: { ...formData.canopy, manufacturer: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={formData.canopy.model}
                    onChange={(e) => setFormData({
                      ...formData,
                      canopy: { ...formData.canopy, model: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    value={formData.canopy.size}
                    onChange={(e) => setFormData({
                      ...formData,
                      canopy: { ...formData.canopy, size: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cell Count</Label>
                  <Input
                    type="number"
                    value={formData.canopy.cellCount}
                    onChange={(e) => setFormData({
                      ...formData,
                      canopy: { ...formData.canopy, cellCount: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Reserve */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Reserve</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.reserve.manufacturer}
                    onChange={(e) => setFormData({
                      ...formData,
                      reserve: { ...formData.reserve, manufacturer: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={formData.reserve.model}
                    onChange={(e) => setFormData({
                      ...formData,
                      reserve: { ...formData.reserve, model: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Size</Label>
                  <Input
                    value={formData.reserve.size}
                    onChange={(e) => setFormData({
                      ...formData,
                      reserve: { ...formData.reserve, size: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Repack Date</Label>
                  <Input
                    type="date"
                    value={formData.reserve.lastRepackDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      reserve: { ...formData.reserve, lastRepackDate: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* AAD */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">AAD</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    value={formData.aad.aadType}
                    onChange={(e) => setFormData({
                      ...formData,
                      aad: { ...formData.aad, aadType: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={formData.aad.model}
                    onChange={(e) => setFormData({
                      ...formData,
                      aad: { ...formData.aad, model: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Service Date</Label>
                  <Input
                    type="date"
                    value={formData.aad.lastServiceDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      aad: { ...formData.aad, lastServiceDate: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Service Due</Label>
                  <Input
                    type="date"
                    value={formData.aad.nextServiceDue}
                    onChange={(e) => setFormData({
                      ...formData,
                      aad: { ...formData.aad, nextServiceDue: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-2">
              <Label>Desired Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.pricing.desiredPrice}
                onChange={(e) => setFormData({
                  ...formData,
                  pricing: { ...formData.pricing, desiredPrice: e.target.value }
                })}
              />
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Verification Images</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Serial Number Photo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleImageSelect('serialNumber', e.target.files)
                    }}
                  />
                  {formData.imagePreviews.serialNumber && (
                    <div className="mt-2">
                      <img src={formData.imagePreviews.serialNumber} alt="Serial Number" className="h-32 w-auto rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Reserve Packing Sheet</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleImageSelect('reservePackingSheet', e.target.files)
                    }}
                  />
                  {formData.imagePreviews.reservePackingSheet && (
                    <div className="mt-2">
                      <img src={formData.imagePreviews.reservePackingSheet} alt="Reserve Packing Sheet" className="h-32 w-auto rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Full Rig View (Multiple Images)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      handleImageSelect('fullRigView', e.target.files, true)
                    }}
                  />
                  {formData.imagePreviews.fullRigView && formData.imagePreviews.fullRigView.length > 0 && (
                    <div className="mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        {formData.imagePreviews.fullRigView.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={preview} 
                              alt={`Full Rig View ${index + 1}`} 
                              className="h-32 w-full object-cover rounded-lg border border-gray-200" 
                            />
                            <button
                              type="button"
                              onClick={() => removeFullRigViewImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {formData.imagePreviews.fullRigView.length} image(s) selected
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/30"
            >
              {loading ? 'Submitting...' : 'Submit Rig'}
            </Button>
          </form>
        </CardContent>
      </Card>
        </div>
      </div>
    </MainLayout>
  )
}

