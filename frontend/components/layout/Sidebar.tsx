'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Home, 
  Search, 
  Package, 
  ShoppingBag, 
  User, 
  Settings, 
  LogOut,
  PlusCircle,
  List,
  CheckSquare,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getImageUrl } from '@/lib/imageUtils'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/listings', icon: Search },
]

const commonNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Edit Profile', href: '/profile', icon: User },
  { name: 'Messages', href: '/chat', icon: MessageSquare },
]

const sellerNavigation = [
  { name: 'Submit Rig', href: '/seller/submit', icon: PlusCircle },
  { name: 'My Listings', href: '/seller/listings', icon: List },
  { name: 'Search Riggers', href: '/seller/search-riggers', icon: Search },
]

const riggerNavigation = [
  { name: 'Inspect Rigs', href: '/rigger/dashboard', icon: CheckSquare },
  { name: 'Rigger Profile', href: '/rigger/profile', icon: User },
]

const buyerNavigation = [
  { name: 'My Orders', href: '/orders', icon: ShoppingBag },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/50">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">SkyGear</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* User-specific Navigation */}
        {user && (
          <>
            {user.role === 'seller' && (
              <div className="pt-6">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Seller
                </p>
                <div className="space-y-1">
                  {sellerNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {user.role === 'rigger' && (
              <div className="pt-6">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Rigger
                </p>
                <div className="space-y-1">
                  {riggerNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {user.role === 'buyer' && (
              <div className="pt-6">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Buyer
                </p>
                <div className="space-y-1">
                  {buyerNavigation.map((item) => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Common Navigation */}
        {user && (
          <div className="pt-6">
            <div className="space-y-1">
              {commonNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200/50">
        {user ? (
          <div className="space-y-2">
            <Link href="/profile" className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.profile?.firstName || user.profile?.lastName
                    ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()
                    : user.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </Link>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link href="/login">
              <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

