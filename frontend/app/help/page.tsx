'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, MessageCircle, Mail, FileText } from 'lucide-react'
import Link from 'next/link'

const faqs = [
  {
    question: "How do I sell my rig?",
    answer: "First, create a seller account. Then choose a vetted rigger from our list, fill in your rig details, upload verification images (serial number, reserve packing sheet, and full rig view), and submit. The rigger will inspect your rig and create a verified listing."
  },
  {
    question: "What are the fees?",
    answer: "For sellers: 88% of the listing price (10% goes to the rigger, 2% to the platform). For riggers: 10% of each listing price. Buyers pay no fees - only the listed price plus shipping if applicable."
  },
  {
    question: "How are rigs verified?",
    answer: "All rigs are inspected by licensed, vetted riggers who create detailed inspection reports including condition assessment, recommended services, and high-quality images. Only rigs that pass inspection are listed."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept credit/debit cards, stablecoins (USDC/USDT), and bank transfers through our secure payment partner Bridge.xyz. All payments are processed securely with multi-party payouts."
  },
  {
    question: "How does shipping work?",
    answer: "Sellers can choose to deliver the rig themselves or use our integrated shipping service. Buyers can choose pickup or shipping during checkout. We use a shipping aggregator for the best rates and full tracking."
  },
  {
    question: "Can I contact the rigger directly?",
    answer: "Yes! Once you find a rig you're interested in, you can click the chat button to open WhatsApp/Telegram and contact the rigger directly with any questions."
  },
  {
    question: "What if I'm not satisfied with my purchase?",
    answer: "All rigs are inspected and verified before listing. If there's a discrepancy between the listing and what you receive, contact our support team immediately. We have a dispute resolution process in place."
  },
  {
    question: "How do I become a verified rigger?",
    answer: "Register as a rigger and submit your license information and verification documents. Our team will review your application. Once approved, you can start inspecting and listing rigs on the platform."
  }
]

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="min-h-screen">
      <Header />
      <div className="min-h-screen bg-[#f5f5f7]">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white via-blue-50/30 to-white py-24">
          <div className="container mx-auto px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6 text-gray-900">
                Help Center
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Find answers to common questions and get the support you need
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-8">
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Read our guides on selling, buying, and using the platform
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center mb-4">
                    <MessageCircle className="h-6 w-6 text-cyan-600" />
                  </div>
                  <CardTitle>Live Chat</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Chat with our support team for immediate assistance
                  </CardDescription>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>Email Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Send us an email and we'll get back to you within 24 hours
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="container mx-auto px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold mb-12 text-center text-gray-900">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card 
                    key={index} 
                    className="border-0 shadow-lg hover:shadow-xl transition-all"
                  >
                    <CardHeader 
                      className="cursor-pointer"
                      onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{faq.question}</CardTitle>
                        {openIndex === index ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </CardHeader>
                    {openIndex === index && (
                      <CardContent>
                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Still Need Help?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our support team is here to help you with any questions or issues
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Start Live Chat
                </Button>
                <Button size="lg" variant="outline">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  )
}

