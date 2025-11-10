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
import Image from 'next/image'
import { Camera, Save, User, Mail, Phone, MapPin } from 'lucide-react'
import { getImageUrl } from '@/lib/imageUtils'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
  })
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return
    }
    
    // Only redirect if auth is done loading and user is null
    if (!user) {
      router.push('/login')
      return
    }
    
    // Load user data
    setFormData({
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      phone: user.profile?.phone || '',
      email: user.email || '',
      address: {
        street: user.profile?.address?.street || '',
        city: user.profile?.address?.city || '',
        state: user.profile?.address?.state || '',
        zipCode: user.profile?.address?.zipCode || '',
        country: user.profile?.address?.country || 'US',
      },
    })
    // Store only path, not full URL - remove domain if present
    const avatarPath = user.profile?.avatar || ''
    const cleanPath = avatarPath ? avatarPath.replace(/^https?:\/\/[^/]+/, '') : ''
    setAvatar(cleanPath)
  }, [user, authLoading, router])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
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

    try {
      setUploadingAvatar(true)
      const uploadFormData = new FormData()
      uploadFormData.append('image', file)
      
      const response = await api.post('/upload/image', uploadFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Store only path, not full URL
      const avatarPath = response.data.path
      setAvatar(avatarPath)
      
      // Update profile immediately with path only
      await api.put('/auth/profile', {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          avatar: avatarPath,
        },
      })

      // Refresh user data
      await refreshUser()
      
      toast({
        title: 'Success',
        description: 'Avatar updated successfully',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload avatar',
        variant: 'destructive',
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.put('/auth/profile', {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          avatar: avatar,
        },
      })

      // Refresh user data
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
  if (!user) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Profile</h1>
            <p className="text-xl text-gray-600">Manage your account information</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Avatar Section */}
            <Card className="border-0 shadow-xl rounded-3xl lg:col-span-1">
              <CardHeader className="text-center pb-4">
                  <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center border-4 border-white shadow-lg">
                    {avatar ? (
                      <Image
                        src={getImageUrl(avatar) || ''}
                        alt="Avatar"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-4xl font-bold">
                        {formData.firstName?.[0] || formData.lastName?.[0] || user.email[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <Camera className="h-5 w-5 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                {uploadingAvatar && (
                  <p className="text-sm text-gray-500 mt-2">Uploading...</p>
                )}
                <CardTitle className="text-xl mt-4">
                  {formData.firstName || formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`
                    : user.email}
                </CardTitle>
                <CardDescription className="capitalize">{user.role}</CardDescription>
              </CardHeader>
            </Card>

            {/* Profile Form */}
            <Card className="border-0 shadow-xl rounded-3xl lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-2xl">Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="John"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-base font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-12 rounded-xl border-2 focus:border-blue-500"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-12 rounded-xl border-2 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-base font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 rounded-xl border-2 focus:border-blue-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Address
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="street" className="text-base font-medium">Street Address</Label>
                        <Input
                          id="street"
                          value={formData.address.street}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: { ...formData.address, street: e.target.value }
                          })}
                          className="h-12 rounded-xl border-2 focus:border-blue-500"
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-base font-medium">City</Label>
                          <Input
                            id="city"
                            value={formData.address.city}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, city: e.target.value }
                            })}
                            className="h-12 rounded-xl border-2 focus:border-blue-500"
                            placeholder="New York"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-base font-medium">State</Label>
                          <Input
                            id="state"
                            value={formData.address.state}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, state: e.target.value }
                            })}
                            className="h-12 rounded-xl border-2 focus:border-blue-500"
                            placeholder="NY"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-base font-medium">ZIP Code</Label>
                          <Input
                            id="zipCode"
                            value={formData.address.zipCode}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, zipCode: e.target.value }
                            })}
                            className="h-12 rounded-xl border-2 focus:border-blue-500"
                            placeholder="10001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-base font-medium">Country</Label>
                          <Input
                            id="country"
                            value={formData.address.country}
                            onChange={(e) => setFormData({
                              ...formData,
                              address: { ...formData.address, country: e.target.value }
                            })}
                            className="h-12 rounded-xl border-2 focus:border-blue-500"
                            placeholder="US"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-lg font-semibold shadow-lg shadow-blue-500/30"
                    >
                      <Save className="mr-2 h-5 w-5" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    {user && (
                      <Link
                        href={
                          user.role === 'rigger' ? `/riggers/${user.id}` :
                          user.role === 'seller' ? `/sellers/${user.id}` :
                          user.role === 'buyer' ? `/buyers/${user.id}` :
                          '/profile'
                        }
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

