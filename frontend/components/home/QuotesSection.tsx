'use client'

import { useState, useEffect } from 'react'
import { Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const quotes = [
  {
    text: "The sky is not the limit, it's just the beginning. Every jump is a chance to push your limits and experience true freedom.",
    author: "Unknown Skydiver"
  },
  {
    text: "In skydiving, as in life, preparation and trust in your equipment are everything. That's why we only work with verified riggers.",
    author: "Professional Rigger"
  },
  {
    text: "Buying a rig is one of the most important decisions a skydiver makes. SkyGear ensures you get quality gear that's been properly inspected.",
    author: "Experienced Jumper"
  },
  {
    text: "The best rig is one that fits perfectly, has been well-maintained, and comes with a complete history. That's what SkyGear delivers.",
    author: "Safety Advocate"
  }
]

export function QuotesSection() {
  const [currentQuote, setCurrentQuote] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Words from the Community</h2>
            <p className="text-xl text-gray-600">Wisdom from skydivers and riggers</p>
          </div>
          
          <Card className="border-0 shadow-xl rounded-3xl p-8">
            <CardContent className="text-center">
              <Quote className="h-12 w-12 text-blue-500 mx-auto mb-6" />
              <blockquote className="text-2xl font-medium text-gray-900 mb-6 leading-relaxed">
                "{quotes[currentQuote].text}"
              </blockquote>
              <p className="text-lg text-gray-600">— {quotes[currentQuote].author}</p>
              
              {/* Quote indicators */}
              <div className="flex justify-center gap-2 mt-8">
                {quotes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuote(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentQuote ? 'w-8 bg-blue-500' : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

