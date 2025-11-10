'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import api from '@/lib/api'
import { getSocket, disconnectSocket } from '@/lib/socket'
import { Send, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import Link from 'next/link'

interface Message {
  _id: string
  sender: {
    _id: string
    profile: {
      firstName: string
      lastName: string
      avatar: string
    }
    email: string
  }
  content: string
  createdAt: string
  read: boolean
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [otherUser, setOtherUser] = useState<any>(null)
  const [chat, setChat] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }
    if (params.userId) {
      initializeChat()
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-chat', chat?._id)
        disconnectSocket()
      }
    }
  }, [params.userId, user, authLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeChat = async () => {
    try {
      setLoading(true)
      
      // Get or create chat
      const chatResponse = await api.get(`/chat/${params.userId}`)
      setChat(chatResponse.data)

      // Get other user info from chat participants (already populated)
      const otherParticipant = chatResponse.data.participants.find(
        (p: any) => p._id !== user?.id
      )
      
      if (otherParticipant) {
        setOtherUser(otherParticipant)
      } else {
        // Fallback: get user info from generic user endpoint (works for all user types)
        const userResponse = await api.get(`/users/${params.userId}`)
        setOtherUser(userResponse.data)
      }

      // Get messages
      const messagesResponse = await api.get(`/chat/${chatResponse.data._id}/messages`)
      setMessages(messagesResponse.data)

      // Setup socket
      const token = localStorage.getItem('token')
      if (token) {
        const socket = getSocket(token)
        socketRef.current = socket

        socket.emit('join-chat', chatResponse.data._id)

        socket.on('new-message', (newMessage: Message) => {
          setMessages((prev) => [...prev, newMessage])
        })

        socket.on('error', (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Socket error',
            variant: 'destructive',
          })
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load chat',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !chat) return

    setSending(true)
    const messageContent = message.trim()
    setMessage('')

    try {
      if (socketRef.current) {
        socketRef.current.emit('send-message', {
          chatId: chat._id,
          content: messageContent
        })
      } else {
        // Fallback to REST API
        const response = await api.post(`/chat/${chat._id}/messages`, {
          content: messageContent
        })
        setMessages((prev) => [...prev, response.data])
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send message',
        variant: 'destructive',
      })
      setMessage(messageContent) // Restore message on error
    } finally {
      setSending(false)
    }
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

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500 mb-4"></div>
            <p className="text-gray-600">Loading chat...</p>
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
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
              {otherUser?.profile?.avatar ? (
                <Image
                  src={getImageUrl(otherUser.profile.avatar) || ''}
                  alt={otherUser.profile?.firstName || 'User'}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {otherUser?.profile?.firstName?.[0] || otherUser?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {otherUser?.profile?.firstName} {otherUser?.profile?.lastName}
              </h2>
              <p className="text-sm text-gray-500">{otherUser?.email}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.sender._id === user.id
              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-3 max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md flex-shrink-0">
                      {msg.sender.profile?.avatar ? (
                        <Image
                          src={getImageUrl(msg.sender.profile.avatar) || ''}
                          alt={msg.sender.profile?.firstName || 'User'}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {msg.sender.profile?.firstName?.[0] || msg.sender.email[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-blue-500 text-white' : 'bg-white border-2 border-gray-200'}`}>
                      <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-900'}`}>
                        {msg.content}
                      </p>
                      <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-8 py-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-4">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-12 rounded-xl border-2 focus:border-blue-500"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!message.trim() || sending}
              className="h-12 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </MainLayout>
  )
}

