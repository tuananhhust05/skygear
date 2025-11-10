'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Users, CheckCircle, Award } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white via-blue-50/30 to-white py-24">
          <div className="container mx-auto px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-gray-900">
                About SkyGear
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                The trusted consignment platform for skydiving gear, connecting sellers, 
                vetted riggers, and buyers in a secure marketplace.
              </p>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-8 text-gray-900">Our Mission</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                SkyGear was born from a simple need: to create a trusted marketplace for 
                skydiving gear where every rig is verified by licensed professionals. We 
                believe that buying and selling skydiving equipment should be safe, transparent, 
                and accessible.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Our platform ensures that every piece of gear goes through rigorous inspection 
                by vetted riggers before being listed, giving buyers confidence and sellers 
                fair market value.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-24 bg-[#f5f5f7]">
          <div className="container mx-auto px-8">
            <h2 className="text-4xl font-bold mb-12 text-center text-gray-900">Our Values</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Safety First</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Every rig is inspected by licensed riggers to ensure safety standards
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-cyan-600" />
                  </div>
                  <CardTitle>Trust & Transparency</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Verified riggers and detailed inspection reports build trust
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Quality Assurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Only vetted and verified riggers can list gear on our platform
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>Fair Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Transparent fees and fair market value for all transactions
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-8">
            <h2 className="text-4xl font-bold mb-12 text-center text-gray-900">How It Works</h2>
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Seller Submits Rig</h3>
                  <p className="text-gray-600">
                    Sellers choose a vetted rigger and submit their rig with details and verification images
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Rigger Inspection</h3>
                  <p className="text-gray-600">
                    Licensed riggers inspect the rig and create detailed reports with condition assessment
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Verified Listing</h3>
                  <p className="text-gray-600">
                    Rigs are listed with full inspection reports, high-quality images, and verified details
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                  4
                </div>
                <div>
                  <h3 className="text-2xl font-semibold mb-2">Secure Transaction</h3>
                  <p className="text-gray-600">
                    Buyers purchase with confidence, and payments are processed securely with multi-party payouts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

