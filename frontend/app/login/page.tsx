'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast({
        title: 'Success',
        description: 'Logged in successfully',
      })
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Login failed',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-blue-100">Sign in to your SkyGear account</p>
        </div>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-2 focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border-2 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-blue-500/30"
            >
              Sign In
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

