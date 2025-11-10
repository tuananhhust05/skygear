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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'seller',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const { register } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        },
      })
      toast({
        title: 'Success',
        description: 'Account created successfully',
      })
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Registration failed',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 py-12">
      <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-blue-100">Join SkyGear today</p>
        </div>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-base font-medium">I am a</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-background px-4 py-2 text-base focus:border-blue-500 focus:outline-none"
              >
                <option value="seller">Seller</option>
                <option value="buyer">Buyer</option>
                <option value="rigger">Rigger</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-base font-medium">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-base font-medium">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="h-12 rounded-xl border-2 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 rounded-xl border-2 focus:border-blue-500"
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-12 rounded-xl border-2 focus:border-blue-500"
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 rounded-xl border-2 focus:border-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-blue-500/30"
            >
              Create Account
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

