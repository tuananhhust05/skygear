'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { Save, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { getImageUrl } from '@/lib/imageUtils'

export default function RiggerProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bio: '',
    yearsOfExperience: '',
    specialties: [] as string[],
    location: {
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    responseTime: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    website: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      linkedin: ''
    },
    certifications: [] as any[],
    businessHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
  })
  const [newSpecialty, setNewSpecialty] = useState('')
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certificateNumber: ''
  })
  const [gallery, setGallery] = useState<string[]>([])
  const [uploadingGallery, setUploadingGallery] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'rigger') {
      router.push('/login')
      return
    }
    loadProfile()
  }, [user, authLoading, router])

  const loadProfile = () => {
    if (user?.riggerInfo) {
      setFormData({
        bio: user.riggerInfo.bio || '',
        yearsOfExperience: user.riggerInfo.yearsOfExperience?.toString() || '',
        specialties: user.riggerInfo.specialties || [],
        location: {
          city: user.riggerInfo.location?.city || '',
          state: user.riggerInfo.location?.state || '',
          country: user.riggerInfo.location?.country || '',
          zipCode: user.riggerInfo.location?.zipCode || ''
        },
        responseTime: user.riggerInfo.responseTime || '',
        shopAddress: user.riggerInfo.shopAddress || '',
        shopPhone: user.riggerInfo.shopPhone || '',
        shopEmail: user.riggerInfo.shopEmail || '',
        website: user.riggerInfo.website || '',
        socialMedia: {
          facebook: user.riggerInfo.socialMedia?.facebook || '',
          instagram: user.riggerInfo.socialMedia?.instagram || '',
          linkedin: user.riggerInfo.socialMedia?.linkedin || ''
        },
        certifications: user.riggerInfo.certifications || [],
        businessHours: user.riggerInfo.businessHours || formData.businessHours
      })
      setGallery(user.riggerInfo.gallery || [])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.put(`/riggers/${user?.id}/profile`, {
        riggerInfo: {
          ...formData,
          yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience) : undefined,
          certifications: formData.certifications.map(cert => ({
            ...cert,
            issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
            expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined
          })),
          gallery: gallery
        }
      })

      await refreshUser()
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, newSpecialty.trim()]
      })
      setNewSpecialty('')
    }
  }

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    })
  }

  const addCertification = () => {
    if (newCertification.name.trim()) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...newCertification }]
      })
      setNewCertification({
        name: '',
        issuer: '',
        issueDate: '',
        expiryDate: '',
        certificateNumber: ''
      })
    }
  }

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
    })
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingGallery(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('image', file)
        const response = await api.post('/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data.path
      })

      const uploadedPaths = await Promise.all(uploadPromises)
      setGallery([...gallery, ...uploadedPaths])
      
      toast({
        title: 'Success',
        description: 'Images uploaded successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload images',
        variant: 'destructive',
      })
    } finally {
      setUploadingGallery(false)
    }
  }

  const removeGalleryImage = (index: number) => {
    setGallery(gallery.filter((_, i) => i !== index))
  }

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

  if (!user || user.role !== 'rigger') {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Rigger Profile</h1>
            <p className="text-xl text-gray-600">Update your profile to attract more sellers</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl">Basic Information</CardTitle>
                <CardDescription>Tell sellers about yourself and your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Bio</Label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="flex min-h-[120px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Tell sellers about your experience, expertise, and what makes you stand out..."
                    rows={5}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Years of Experience</Label>
                    <Input
                      type="number"
                      value={formData.yearsOfExperience}
                      onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Response Time</Label>
                    <select
                      value={formData.responseTime}
                      onChange={(e) => setFormData({ ...formData, responseTime: e.target.value })}
                      className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select response time</option>
                      <option value="Within 1 hour">Within 1 hour</option>
                      <option value="Within 4 hours">Within 4 hours</option>
                      <option value="Within 24 hours">Within 24 hours</option>
                      <option value="Within 48 hours">Within 48 hours</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-semibold">Specialties</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                      placeholder="e.g., Rig Inspection, Reserve Repack"
                    />
                    <Button type="button" onClick={addSpecialty} className="h-12 px-6">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                      >
                        {specialty}
                        <button
                          type="button"
                          onClick={() => removeSpecialty(specialty)}
                          className="ml-2 hover:text-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl">Location</CardTitle>
                <CardDescription>Where is your shop located?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">City</Label>
                    <Input
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, city: e.target.value }
                      })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">State / Province</Label>
                    <Input
                      value={formData.location.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, state: e.target.value }
                      })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Country</Label>
                    <Input
                      value={formData.location.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, country: e.target.value }
                      })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">ZIP / Postal Code</Label>
                    <Input
                      value={formData.location.zipCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, zipCode: e.target.value }
                      })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl">Contact Information</CardTitle>
                <CardDescription>How can sellers reach you?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Shop Address</Label>
                    <Input
                      value={formData.shopAddress}
                      onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Shop Phone</Label>
                    <Input
                      value={formData.shopPhone}
                      onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Shop Email</Label>
                    <Input
                      type="email"
                      value={formData.shopEmail}
                      onChange={(e) => setFormData({ ...formData, shopEmail: e.target.value })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                      placeholder="shop@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Website</Label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <Label className="text-base font-semibold">Social Media</Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Facebook</Label>
                      <Input
                        value={formData.socialMedia.facebook}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                        })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instagram</Label>
                      <Input
                        value={formData.socialMedia.instagram}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                        })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>LinkedIn</Label>
                      <Input
                        value={formData.socialMedia.linkedin}
                        onChange={(e) => setFormData({
                          ...formData,
                          socialMedia: { ...formData.socialMedia, linkedin: e.target.value }
                        })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="https://linkedin.com/in/..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl">Certifications</CardTitle>
                <CardDescription>Add your professional certifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="p-4 border-2 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 grid md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Certification Name</Label>
                          <p className="font-semibold">{cert.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Issuer</Label>
                          <p className="font-semibold">{cert.issuer}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Issue Date</Label>
                          <p className="font-semibold">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm">Expiry Date</Label>
                          <p className="font-semibold">{cert.expiryDate ? new Date(cert.expiryDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCertification(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="p-4 border-2 border-dashed rounded-xl space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Certification Name *</Label>
                      <Input
                        value={newCertification.name}
                        onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="e.g., Master Rigger"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issuer</Label>
                      <Input
                        value={newCertification.issuer}
                        onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="e.g., USPA"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Issue Date</Label>
                      <Input
                        type="date"
                        value={newCertification.issueDate}
                        onChange={(e) => setNewCertification({ ...newCertification, issueDate: e.target.value })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={newCertification.expiryDate}
                        onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Certificate Number</Label>
                      <Input
                        value={newCertification.certificateNumber}
                        onChange={(e) => setNewCertification({ ...newCertification, certificateNumber: e.target.value })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="Certificate number"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addCertification}
                    variant="outline"
                    className="w-full"
                    disabled={!newCertification.name.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gallery */}
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardHeader>
                <CardTitle className="text-2xl">Service Gallery</CardTitle>
                <CardDescription>Upload images showcasing your services and shop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-2 block">Upload Images</Label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    disabled={uploadingGallery}
                    className="hidden"
                    id="gallery-upload"
                  />
                  <label
                    htmlFor="gallery-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-500 transition-colors"
                  >
                    {uploadingGallery ? (
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500 mb-2"></div>
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Click to upload images</p>
                        <p className="text-xs text-gray-500">Multiple images supported</p>
                      </div>
                    )}
                  </label>
                </div>

                {gallery.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {gallery.map((imagePath, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                          <img
                            src={getImageUrl(imagePath) || ''}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/rigger/dashboard')}
                className="h-14 rounded-xl border-2 text-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/30"
              >
                <Save className="mr-2 h-5 w-5" />
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
              {user && (
                <Link
                  href={`/riggers/${user.id}`}
                  className="flex-1"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-14 rounded-xl border-2 text-lg font-semibold hover:bg-gray-50"
                  >
                    View Public Profile
                  </Button>
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

