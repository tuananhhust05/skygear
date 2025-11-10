'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { FeaturedListings } from '@/components/home/FeaturedListings'
import { StatsSection } from '@/components/home/StatsSection'
import { QuotesSection } from '@/components/home/QuotesSection'
import { RiggersShowcase } from '@/components/home/RiggersShowcase'
import { TeamMembersShowcase } from '@/components/home/TeamMembersShowcase'
import { Search, Shield, Users, Package, ArrowRight, Sparkles } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <Header />
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-blue-50/30 to-white">
          {/* <div className="absolute inset-0 bg-grid-pattern opacity-5"></div> */}
          <div className="container mx-auto px-8 py-24">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full mb-8">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Verified Consignment Platform</span>
              </div>
              <h1 style={{lineHeight:1.5}}className="text-6xl font-bold mb-6 text-gray-900 tracking-tight">
                Consignment Platform for
                <span className="block bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Skydiving Gear
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto">
                Verified rigs from vetted riggers. Secure transactions. Trusted marketplace.
                Buy and sell with confidence.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/listings" className="cursor-pointer">
                  <Button 
                    size="lg" 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                  >
                    Browse Rigs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {user ? (
                  <Link href="/dashboard" className="cursor-pointer">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="px-8 py-6 text-lg rounded-2xl border-2 hover:bg-gray-50 hover:scale-105 hover:border-blue-500 transition-all duration-300 cursor-pointer"
                    >
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/seller/submit" className="cursor-pointer">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="px-8 py-6 text-lg rounded-2xl border-2 hover:bg-gray-50 hover:scale-105 hover:border-blue-500 transition-all duration-300 cursor-pointer"
                      >
                        Sell Your Rig
                      </Button>
                    </Link>
                    <Link href="/register" className="cursor-pointer">
                      <Button 
                        size="lg" 
                        className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose SkyGear
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need for buying and selling skydiving gear
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Verified Rigs</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    All rigs inspected by vetted and verified riggers with detailed reports
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-cyan-600" />
                  </div>
                  <CardTitle className="text-xl">Trusted Riggers</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Only licensed and verified riggers can list gear on our platform
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                    <Package className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Secure Shipping</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Integrated shipping with tracking and insurance for peace of mind
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">Easy Search</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Find the perfect rig with detailed inspection reports and filters
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-8">
            <FeaturedListings />
          </div>
        </section>

        {/* Stats Section */}
        <StatsSection />

        {/* Quotes Section */}
        <QuotesSection />

        {/* Riggers Showcase */}
        <RiggersShowcase />

        {/* Team Members Showcase */}
        <TeamMembersShowcase />
      </div>
      <Footer />
    </div>
  )
}

