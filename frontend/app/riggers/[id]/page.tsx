'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import { 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Facebook, 
  Instagram, 
  Linkedin,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  MessageCircle,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

interface Review {
  _id: string
  rating: number
  comment: string
  reviewer: {
    profile: {
      firstName: string
      lastName: string
      avatar: string
    }
    email: string
  }
  createdAt: string
}

// Gallery Slideshow Component
function GallerySlideshow({ images }: { images: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToImage = (index: number) => {
    setCurrentIndex(index)
  }

  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
      }, 5656) // Auto-rotate every 5 seconds
      return () => clearInterval(interval)
    }
  }, [images.length])

  return (
    <div className="relative w-full h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-gray-100">
      {images.map((imagePath, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={getImageUrl(imagePath) || ''}
            alt={`Gallery ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm z-10">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}

// Review Item Component with avatar error handling
function ReviewItem({ review, renderStars }: { review: Review, renderStars: (rating: number, size?: 'sm' | 'md' | 'lg') => JSX.Element }) {
  const [avatarError, setAvatarError] = useState(false)
  const avatarUrl = review.reviewer.profile?.avatar ? getImageUrl(review.reviewer.profile.avatar) : null

  return (
    <div className="p-4 border-2 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
            {avatarUrl && !avatarError ? (
              <Image
                src={avatarUrl}
                alt={review.reviewer.profile?.firstName || 'Reviewer'}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span className="text-white text-sm font-semibold">
                {review.reviewer.profile?.firstName?.[0] || review.reviewer.profile?.lastName?.[0] || review.reviewer.email[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold">
              {review.reviewer.profile?.firstName} {review.reviewer.profile?.lastName}
            </p>
            <p className="text-sm text-gray-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {renderStars(review.rating, 'sm')}
      </div>
      {review.comment && (
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
      )}
    </div>
  )
}

export default function RiggerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [rigger, setRigger] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchRiggerData()
      fetchReviews()
    }
  }, [params.id])

  const fetchRiggerData = async () => {
    try {
      const response = await api.get(`/riggers/${params.id}/public`)
      setRigger(response.data.rigger)
      setStats(response.data.stats)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load rigger information',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/rigger/${params.id}`)
      setReviews(response.data.reviews)
      setAverageRating(response.data.averageRating || 0)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      router.push('/login')
      return
    }

    setReviewLoading(true)
    try {
      await api.post('/reviews', {
        riggerId: params.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      })

      toast({
        title: 'Success',
        description: 'Review submitted successfully',
      })

      setReviewForm({ rating: 5, comment: '' })
      setShowReviewForm(false)
      fetchReviews()
      fetchRiggerData() // Refresh to update average rating
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit review',
        variant: 'destructive',
      })
    } finally {
      setReviewLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!rigger) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <Card className="border-0 shadow-xl rounded-3xl p-8">
            <CardContent className="text-center">
              <p className="text-xl text-gray-600">Rigger not found</p>
              <Link href="/listings">
                <Button className="mt-4">Browse Listings</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          {/* Header Section */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {rigger.profile?.avatar ? (
                  <Image
                    src={getImageUrl(rigger.profile.avatar) || ''}
                    alt={rigger.profile?.firstName || 'Rigger'}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-5xl font-bold">
                    {rigger.profile?.firstName?.[0] || rigger.profile?.lastName?.[0] || 'R'}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-bold text-gray-900">
                    {rigger.profile?.firstName} {rigger.profile?.lastName}
                  </h1>
                  <div className="bg-green-500 rounded-full p-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl text-gray-600 mb-4">{rigger.riggerInfo?.shopName}</p>
                
                {/* Rating */}
                <div className="flex items-center gap-4 mb-4">
                  {renderStars(Math.round(averageRating), 'lg')}
                  <span className="text-2xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-600">
                    ({rigger.riggerInfo?.totalReviews || 0} reviews)
                  </span>
                </div>

                {/* Stats */}
                {stats && (
                  <div className="flex gap-6 mt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalListings || 0}</p>
                      <p className="text-sm text-gray-600">Active Listings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.completedOrders || 0}</p>
                      <p className="text-sm text-gray-600">Completed Orders</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        ${(stats.totalEarnings || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                    </div>
                  </div>
                )}
              </div>
              {user && user.id !== rigger._id && (
                <Link href={`/chat/${rigger._id}`}>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-6 text-lg rounded-xl shadow-lg shadow-blue-500/30">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Send Message
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Gallery Banner - Nổi bật nếu có ảnh */}
          {rigger.riggerInfo?.gallery && rigger.riggerInfo.gallery.length > 0 && (
            <div className="mb-12">
              <GallerySlideshow images={rigger.riggerInfo.gallery} />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {rigger.riggerInfo?.bio && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {rigger.riggerInfo.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Specialties */}
              {rigger.riggerInfo?.specialties && rigger.riggerInfo.specialties.length > 0 && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Specialties</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {rigger.riggerInfo.specialties.map((specialty: string) => (
                        <span
                          key={specialty}
                          className="px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {rigger.riggerInfo?.certifications && rigger.riggerInfo.certifications.length > 0 && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Certifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rigger.riggerInfo.certifications.map((cert: any, index: number) => (
                        <div key={index} className="p-4 border-2 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-lg">{cert.name}</p>
                              <p className="text-gray-600">{cert.issuer}</p>
                              {cert.certificateNumber && (
                                <p className="text-sm text-gray-500">Cert #: {cert.certificateNumber}</p>
                              )}
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              {cert.issueDate && (
                                <p>Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                              )}
                              {cert.expiryDate && (
                                <p>Expires: {new Date(cert.expiryDate).toLocaleDateString()}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl">Reviews</CardTitle>
                      <CardDescription>
                        {rigger.riggerInfo?.totalReviews || 0} total reviews
                      </CardDescription>
                    </div>
                    {user && user.id !== rigger._id && (
                      <Button
                        onClick={() => setShowReviewForm(!showReviewForm)}
                        variant="outline"
                        className="rounded-xl"
                      >
                        Write Review
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Review Form */}
                  {showReviewForm && user && user.id !== rigger._id && (
                    <form onSubmit={handleSubmitReview} className="p-4 border-2 rounded-xl space-y-4">
                      <div className="space-y-2">
                        <Label>Rating</Label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`h-8 w-8 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 font-semibold">{reviewForm.rating} stars</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Comment</Label>
                        <textarea
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          className="flex min-h-[100px] w-full rounded-xl border-2 border-input bg-background px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                          placeholder="Share your experience..."
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={reviewLoading}
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Submit Review
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowReviewForm(false)}
                          className="rounded-xl"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Reviews List */}
                  {reviews.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No reviews yet</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <ReviewItem key={review._id} review={review} renderStars={renderStars} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="border-0 shadow-xl rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rigger.riggerInfo?.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                      <div>
                        <p className="font-semibold">Location</p>
                        <p className="text-gray-600">
                          {rigger.riggerInfo.location.city && `${rigger.riggerInfo.location.city}, `}
                          {rigger.riggerInfo.location.state && `${rigger.riggerInfo.location.state} `}
                          {rigger.riggerInfo.location.country}
                        </p>
                        {rigger.riggerInfo.shopAddress && (
                          <p className="text-sm text-gray-500 mt-1">{rigger.riggerInfo.shopAddress}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {rigger.riggerInfo?.shopPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <p className="text-gray-600">{rigger.riggerInfo.shopPhone}</p>
                      </div>
                    </div>
                  )}
                  {rigger.riggerInfo?.shopEmail && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold">Email</p>
                        <a href={`mailto:${rigger.riggerInfo.shopEmail}`} className="text-blue-600 hover:underline">
                          {rigger.riggerInfo.shopEmail}
                        </a>
                      </div>
                    </div>
                  )}
                  {rigger.riggerInfo?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold">Website</p>
                        <a href={rigger.riggerInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {rigger.riggerInfo.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {rigger.riggerInfo?.responseTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-semibold">Response Time</p>
                        <p className="text-gray-600">{rigger.riggerInfo.responseTime}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Media */}
              {rigger.riggerInfo?.socialMedia && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Social Media</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {rigger.riggerInfo.socialMedia.facebook && (
                      <a
                        href={rigger.riggerInfo.socialMedia.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-600 hover:text-blue-700"
                      >
                        <Facebook className="h-5 w-5" />
                        <span>Facebook</span>
                      </a>
                    )}
                    {rigger.riggerInfo.socialMedia.instagram && (
                      <a
                        href={rigger.riggerInfo.socialMedia.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-pink-600 hover:text-pink-700"
                      >
                        <Instagram className="h-5 w-5" />
                        <span>Instagram</span>
                      </a>
                    )}
                    {rigger.riggerInfo.socialMedia.linkedin && (
                      <a
                        href={rigger.riggerInfo.socialMedia.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-blue-700 hover:text-blue-800"
                      >
                        <Linkedin className="h-5 w-5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              {rigger.riggerInfo?.yearsOfExperience && (
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">
                      {rigger.riggerInfo.yearsOfExperience}
                    </p>
                    <p className="text-gray-600">Years of Experience</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

