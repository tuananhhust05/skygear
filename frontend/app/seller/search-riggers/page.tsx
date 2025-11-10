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
import { getImageUrl } from '@/lib/imageUtils'
import { Search, MapPin, Clock, Award, Mail, Phone, User } from 'lucide-react'
import Link from 'next/link'

export default function SearchRiggersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [riggers, setRiggers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    email: '',
    name: '',
    phone: '',
    experience: '',
    responseTime: '',
    keyword: '',
    country: '',
    address: ''
  })

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'seller') {
      router.push('/login')
      return
    }
    // Load all riggers by default, sorted by updatedAt
    loadAllRiggers()
  }, [user, authLoading, router])

  const loadAllRiggers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/riggers')
      setRiggers(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load riggers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params: any = {}
      
      // Only include non-empty filters
      Object.keys(searchFilters).forEach(key => {
        if (searchFilters[key as keyof typeof searchFilters].trim()) {
          params[key] = searchFilters[key as keyof typeof searchFilters]
        }
      })

      // If no filters, load all riggers
      if (Object.keys(params).length === 0) {
        await loadAllRiggers()
        return
      }

      const response = await api.get('/riggers/search', { params })
      setRiggers(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search riggers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setSearchFilters({
      email: '',
      name: '',
      phone: '',
      experience: '',
      responseTime: '',
      keyword: '',
      country: '',
      address: ''
    })
    // Load all riggers when reset
    loadAllRiggers()
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

  if (!user || user.role !== 'seller') {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Search Riggers</h1>
            <p className="text-xl text-gray-600">Find the perfect rigger for your gear</p>
          </div>

          {/* Search Form */}
          <Card className="border-0 shadow-xl rounded-3xl mb-8">
            <CardHeader>
              <CardTitle className="text-2xl">Search Filters</CardTitle>
              <CardDescription>Use any combination of filters to find riggers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    value={searchFilters.email}
                    onChange={(e) => setSearchFilters({ ...searchFilters, email: e.target.value })}
                    placeholder="Search by email..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Name
                  </Label>
                  <Input
                    value={searchFilters.name}
                    onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
                    placeholder="Search by name..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    value={searchFilters.phone}
                    onChange={(e) => setSearchFilters({ ...searchFilters, phone: e.target.value })}
                    placeholder="Search by phone..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Experience (Years)
                  </Label>
                  <Input
                    type="number"
                    value={searchFilters.experience}
                    onChange={(e) => setSearchFilters({ ...searchFilters, experience: e.target.value })}
                    placeholder="Minimum years..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Response Time
                  </Label>
                  <Input
                    value={searchFilters.responseTime}
                    onChange={(e) => setSearchFilters({ ...searchFilters, responseTime: e.target.value })}
                    placeholder="e.g., Within 24 hours"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Keyword (Bio)
                  </Label>
                  <Input
                    value={searchFilters.keyword}
                    onChange={(e) => setSearchFilters({ ...searchFilters, keyword: e.target.value })}
                    placeholder="Search in bio..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Country
                  </Label>
                  <Input
                    value={searchFilters.country}
                    onChange={(e) => setSearchFilters({ ...searchFilters, country: e.target.value })}
                    placeholder="Search by country..."
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </Label>
                  <Input
                    value={searchFilters.address}
                    onChange={(e) => setSearchFilters({ ...searchFilters, address: e.target.value })}
                    placeholder="Search by address..."
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/30"
                >
                  <Search className="mr-2 h-5 w-5" />
                  {loading ? 'Searching...' : 'Search'}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="px-8 py-6 text-lg rounded-xl border-2"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {riggers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Found {riggers.length} Rigger{riggers.length !== 1 ? 's' : ''}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {riggers.map((rigger) => (
                  <Link key={rigger._id} href={`/riggers/${rigger._id}`}>
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-3xl cursor-pointer">
                      <CardHeader>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                            {rigger.profile?.avatar ? (
                              <Image
                                src={getImageUrl(rigger.profile.avatar) || ''}
                                alt={rigger.profile?.firstName || 'Rigger'}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-2xl font-bold">
                                {rigger.profile?.firstName?.[0] || rigger.profile?.lastName?.[0] || 'R'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl">
                              {rigger.profile?.firstName} {rigger.profile?.lastName}
                            </CardTitle>
                            <CardDescription>{rigger.riggerInfo?.shopName}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {rigger.riggerInfo?.yearsOfExperience && (
                            <p className="text-gray-600">
                              <Award className="inline h-4 w-4 mr-1" />
                              {rigger.riggerInfo.yearsOfExperience} years experience
                            </p>
                          )}
                          {rigger.riggerInfo?.responseTime && (
                            <p className="text-gray-600">
                              <Clock className="inline h-4 w-4 mr-1" />
                              {rigger.riggerInfo.responseTime}
                            </p>
                          )}
                          {rigger.riggerInfo?.location?.country && (
                            <p className="text-gray-600">
                              <MapPin className="inline h-4 w-4 mr-1" />
                              {rigger.riggerInfo.location.city && `${rigger.riggerInfo.location.city}, `}
                              {rigger.riggerInfo.location.country}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {riggers.length === 0 && !loading && (
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardContent className="py-16 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600 font-medium mb-2">No riggers found</p>
                <p className="text-gray-500">Try adjusting your search filters</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

