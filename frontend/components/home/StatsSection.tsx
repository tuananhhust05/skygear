'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, CheckCircle, Package, DollarSign } from 'lucide-react'
import api from '@/lib/api'

interface Stats {
  totalUsers: number
  totalRiggers: number
  totalListings: number
  totalOrders: number
  totalRevenue: number
}

export function StatsSection() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalRiggers: 0,
    totalListings: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const [displayStats, setDisplayStats] = useState<Stats>({
    totalUsers: 0,
    totalRiggers: 0,
    totalListings: 0,
    totalOrders: 0,
    totalRevenue: 0
  })
  const [hasAnimated, setHasAnimated] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (!hasAnimated && stats.totalUsers > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            animateNumbers()
            setHasAnimated(true)
          }
        },
        { threshold: 0.5 }
      )

      if (sectionRef.current) {
        observer.observe(sectionRef.current)
      }

      return () => observer.disconnect()
    }
  }, [stats, hasAnimated])

  const fetchStats = async () => {
    try {
      const response = await api.get('/stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set default values for demo
      setStats({
        totalUsers: 1250,
        totalRiggers: 45,
        totalListings: 320,
        totalOrders: 890,
        totalRevenue: 2450000
      })
    }
  }

  const animateNumbers = () => {
    const duration = 2000 // 2 seconds
    const steps = 60
    const stepDuration = duration / steps

    const timers: NodeJS.Timeout[] = []

    Object.keys(stats).forEach((key) => {
      const target = stats[key as keyof Stats]
      let current = 0
      const increment = target / steps
      
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          current = target
          clearInterval(timer)
        }
        setDisplayStats((prev) => ({ ...prev, [key as keyof Stats]: Math.floor(current) }))
      }, stepDuration)
      
      timers.push(timer)
    })

    return () => {
      timers.forEach(timer => clearInterval(timer))
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toLocaleString()}`
  }

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Platform Statistics</h2>
          <p className="text-xl text-blue-100">Trusted by skydivers worldwide</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="text-5xl font-bold mb-2">{displayStats.totalUsers.toLocaleString()}+</div>
            <p className="text-blue-100">Active Users</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="text-5xl font-bold mb-2">{displayStats.totalRiggers}</div>
            <p className="text-blue-100">Verified Riggers</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-white" />
            </div>
            <div className="text-5xl font-bold mb-2">{displayStats.totalListings}</div>
            <p className="text-blue-100">Active Listings</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="text-5xl font-bold mb-2">{displayStats.totalOrders}</div>
            <p className="text-blue-100">Completed Orders</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <div className="text-5xl font-bold mb-2">{formatCurrency(displayStats.totalRevenue)}</div>
            <p className="text-blue-100">Total Revenue</p>
          </div>
        </div>
      </div>
    </section>
  )
}

