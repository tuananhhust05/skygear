'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { getImageUrl } from '@/lib/imageUtils'
import { 
  User, 
  LogOut, 
  Settings, 
  ShoppingBag,
  Package,
  FileText,
  HelpCircle,
  DollarSign,
  Menu,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, loading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
    setMobileMenuOpen(false)
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">SkyGear</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/listings">
              <Button 
                variant={isActive('/listings') ? 'default' : 'ghost'}
                className={isActive('/listings') ? 'bg-blue-500 text-white' : ''}
              >
                Browse
              </Button>
            </Link>
            <Link href="/about">
              <Button 
                variant={isActive('/about') ? 'default' : 'ghost'}
                className={isActive('/about') ? 'bg-blue-500 text-white' : ''}
              >
                About
              </Button>
            </Link>
            <Link href="/pricing">
              <Button 
                variant={isActive('/pricing') ? 'default' : 'ghost'}
                className={isActive('/pricing') ? 'bg-blue-500 text-white' : ''}
              >
                Pricing
              </Button>
            </Link>
            <Link href="/help">
              <Button 
                variant={isActive('/help') ? 'default' : 'ghost'}
                className={isActive('/help') ? 'bg-blue-500 text-white' : ''}
              >
                Help
              </Button>
            </Link>
          </nav>

          {/* Right Side - Auth */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            ) : user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden md:flex items-center space-x-4">
                  {user.role === 'seller' && (
                    <Link href="/seller/submit">
                      <Button variant="outline" size="sm">
                        <Package className="h-4 w-4 mr-2" />
                        Sell
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center space-x-2 focus:outline-none">
                        <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                          {user.profile?.avatar ? (
                            <Image
                              src={getImageUrl(user.profile.avatar) || ''}
                              alt="Avatar"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-sm font-semibold">
                              {user.profile?.firstName?.[0] || user.profile?.lastName?.[0] || user.email[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium">
                            {user.profile?.firstName || user.profile?.lastName
                              ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()
                              : user.email}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="hidden md:flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </div>
                <button
                  className="md:hidden p-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            <Link href="/listings" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Browse
              </Button>
            </Link>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                About
              </Button>
            </Link>
            <Link href="/pricing" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Pricing
              </Button>
            </Link>
            <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                Help
              </Button>
            </Link>
            {user ? (
              <>
                <div className="pt-4 border-t">
                  <div className="flex items-center space-x-3 px-4 py-2">
                    <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden">
                      {user.profile?.avatar ? (
                        <Image
                          src={getImageUrl(user.profile.avatar) || ''}
                          alt="Avatar"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm font-semibold">
                          {user.profile?.firstName?.[0] || user.profile?.lastName?.[0] || user.email[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.profile?.firstName || user.profile?.lastName
                          ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()
                          : user.email}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Settings className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="pt-4 border-t space-y-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

