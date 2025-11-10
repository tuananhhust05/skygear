'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import { MessageCircle, Search, UserPlus, X } from 'lucide-react'
import Link from 'next/link'

interface Chat {
  _id: string
  participants: Array<{
    _id: string
    profile: {
      firstName: string
      lastName: string
      avatar: string
    }
    email: string
  }>
  lastMessage: {
    content: string
    createdAt: string
    sender: {
      _id: string
    }
  }
  lastMessageAt: string
}

interface SearchUser {
  _id: string
  email: string
  role: string
  profile: {
    firstName?: string
    lastName?: string
    avatar?: string
  }
}

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    fetchChats()
  }, [user, authLoading, router])

  const fetchChats = async () => {
    try {
      const response = await api.get('/chat')
      setChats(response.data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load chats',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const getOtherUser = (chat: Chat) => {
    return chat.participants.find(p => p._id !== user?.id)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  useEffect(() => {
    if (!user) return
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery)
      } else {
        setSearchResults([])
        setShowSearchResults(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timeoutId)
  }, [searchQuery, user])

  const performSearch = async (query: string) => {
    setSearching(true)
    try {
      const response = await api.get('/users/search', {
        params: { q: query }
      })
      // Filter out current user
      const filtered = response.data.filter((u: SearchUser) => u._id !== user?.id)
      setSearchResults(filtered)
      setShowSearchResults(true)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      })
    } finally {
      setSearching(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleStartChat = async (userId: string) => {
    try {
      // Create or get chat
      const response = await api.post('/chat', { recipientId: userId })
      // Navigate to chat
      router.push(`/chat/${userId}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start chat',
        variant: 'destructive',
      })
    }
  }

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading chats...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f5f5f7]">
        <div className="container mx-auto px-8 py-12">
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-2 text-gray-900">Messages</h1>
            <p className="text-xl text-gray-600">Your conversations</p>
          </div>

          {/* Search Bar */}
          <div 
            className="mb-8 relative"
            onBlur={(e) => {
              // Close search results when clicking outside
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setTimeout(() => setShowSearchResults(false), 200)
              }
            }}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true)
                  }
                }}
                className="pl-12 pr-12 h-14 rounded-xl border-2 focus:border-blue-500 text-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setShowSearchResults(false)
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <Card className="absolute z-10 w-full mt-2 border-0 shadow-xl rounded-2xl max-h-96 overflow-y-auto">
                <CardContent className="p-2">
                  <div className="space-y-2">
                    {searchResults.map((searchUser) => {
                      // Check if chat already exists
                      const existingChat = chats.find(chat => 
                        chat.participants.some(p => p._id === searchUser._id)
                      )
                      
                      return (
                      <div
                        key={searchUser._id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (existingChat) {
                            router.push(`/chat/${searchUser._id}`)
                          } else {
                            handleStartChat(searchUser._id)
                          }
                        }}
                      >
                        <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                          {searchUser.profile?.avatar ? (
                            <Image
                              src={getImageUrl(searchUser.profile.avatar) || ''}
                              alt={searchUser.profile?.firstName || 'User'}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-lg font-bold">
                              {searchUser.profile?.firstName?.[0] || searchUser.email[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900">
                            {searchUser.profile?.firstName && searchUser.profile?.lastName
                              ? `${searchUser.profile.firstName} ${searchUser.profile.lastName}`
                              : searchUser.email}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{searchUser.email}</p>
                          <p className="text-xs text-gray-500 capitalize">{searchUser.role}</p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (existingChat) {
                              router.push(`/chat/${searchUser._id}`)
                            } else {
                              handleStartChat(searchUser._id)
                            }
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          {existingChat ? 'Open Chat' : 'Start Chat'}
                        </Button>
                      </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <Card className="absolute z-10 w-full mt-2 border-0 shadow-xl rounded-2xl">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">No users found</p>
                </CardContent>
              </Card>
            )}
          </div>

          {chats.length === 0 ? (
            <Card className="border-0 shadow-xl rounded-3xl">
              <CardContent className="py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-xl text-gray-600 font-medium mb-2">No messages yet</p>
                <p className="text-gray-500">Start a conversation with a rigger or seller</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {chats.map((chat) => {
                const otherUser = getOtherUser(chat)
                if (!otherUser) return null

                return (
                  <Link key={chat._id} href={`/chat/${otherUser._id}`} className="block">
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-3xl cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                            {otherUser.profile?.avatar ? (
                              <Image
                                src={getImageUrl(otherUser.profile.avatar) || ''}
                                alt={otherUser.profile?.firstName || 'User'}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-2xl font-bold">
                                {otherUser.profile?.firstName?.[0] || otherUser.email[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {otherUser.profile?.firstName} {otherUser.profile?.lastName}
                            </h3>
                            {chat.lastMessage && (
                              <p className="text-sm text-gray-600 truncate">
                                {chat.lastMessage.sender._id === user.id ? 'You: ' : ''}
                                {chat.lastMessage.content}
                              </p>
                            )}
                          </div>
                          {chat.lastMessageAt && (
                            <div className="text-sm text-gray-500">
                              {formatTime(chat.lastMessageAt)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}

