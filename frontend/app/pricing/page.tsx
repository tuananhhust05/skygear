'use client'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white via-blue-50/30 to-white py-24">
          <div className="container mx-auto px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-gray-900">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Fair fees for everyone. No hidden costs.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-24">
          <div className="container mx-auto px-8">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Seller */}
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl mb-2">For Sellers</CardTitle>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      88%
                    </div>
                    <CardDescription className="text-base">
                      of listing price
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Verified rigger inspection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Professional listing creation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Secure payment processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Multi-party payout system</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Fees breakdown:</p>
                      <p className="text-sm text-gray-600">• 10% to Rigger</p>
                      <p className="text-sm text-gray-600">• 2% to Platform</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Rigger */}
                <Card className="border-0 shadow-xl rounded-3xl border-2 border-blue-500">
                  <CardHeader className="text-center pb-4">
                    <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-2">
                      Popular
                    </div>
                    <CardTitle className="text-2xl mb-2">For Riggers</CardTitle>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      10%
                    </div>
                    <CardDescription className="text-base">
                      of listing price
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Inspection fee per rig</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Listing creation service</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Verified rigger badge</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Direct contact with buyers</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500 mb-2">Requirements:</p>
                      <p className="text-sm text-gray-600">• Licensed rigger</p>
                      <p className="text-sm text-gray-600">• Verification approved</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Buyer */}
                <Card className="border-0 shadow-xl rounded-3xl">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl mb-2">For Buyers</CardTitle>
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      Free
                    </div>
                    <CardDescription className="text-base">
                      to browse and buy
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Browse verified listings</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Detailed inspection reports</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Direct contact with riggers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Secure payment options</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm">Integrated shipping</span>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        No fees for buyers. Only pay the listed price plus shipping.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fee Breakdown */}
              <div className="mt-16">
                <Card className="border-0 shadow-lg rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-2xl">Fee Breakdown Example</CardTitle>
                    <CardDescription>For a $5,000 rig sale</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Listing Price</span>
                        <span className="font-semibold">$5,000.00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Rigger Fee (10%)</span>
                        <span className="font-semibold text-blue-600">-$500.00</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-gray-600">Platform Fee (2%)</span>
                        <span className="font-semibold text-blue-600">-$100.00</span>
                      </div>
                      <div className="flex justify-between items-center py-3 bg-blue-50 rounded-xl px-4">
                        <span className="font-semibold text-lg">Seller Receives</span>
                        <span className="font-bold text-xl text-blue-600">$4,400.00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <Link href="/register">
                  <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-6 text-lg rounded-2xl">
                    Get Started Today
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

