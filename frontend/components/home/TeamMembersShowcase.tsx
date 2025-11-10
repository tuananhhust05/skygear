'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Linkedin, Mail } from 'lucide-react'
import Image from 'next/image'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  avatar?: string
  linkedin?: string
  email?: string
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Alex Thompson',
    role: 'CEO & Founder',
    bio: 'Former professional skydiver with 15+ years of experience. Passionate about making quality gear accessible to all.',
    avatar: '/team/alex.jpg',
    linkedin: 'https://linkedin.com/in/alexthompson',
    email: 'alex@skygear.com'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    role: 'Head of Operations',
    bio: 'Expert in supply chain and logistics. Ensures smooth operations and exceptional customer experience.',
    avatar: '/team/sarah.jpg',
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    email: 'sarah@skygear.com'
  },
  {
    id: '3',
    name: 'Mike Chen',
    role: 'CTO',
    bio: 'Tech enthusiast building secure and scalable platforms. Former engineer at leading fintech companies.',
    avatar: '/team/mike.jpg',
    linkedin: 'https://linkedin.com/in/mikechen',
    email: 'mike@skygear.com'
  },
  {
    id: '4',
    name: 'Emma Wilson',
    role: 'Head of Verification',
    bio: 'Certified rigger with 10+ years of experience. Ensures all gear meets the highest safety standards.',
    avatar: '/team/emma.jpg',
    linkedin: 'https://linkedin.com/in/emmawilson',
    email: 'emma@skygear.com'
  },
  {
    id: '5',
    name: 'David Martinez',
    role: 'Head of Customer Success',
    bio: 'Dedicated to helping customers find the perfect gear. Skydiver and gear enthusiast.',
    avatar: '/team/david.jpg',
    linkedin: 'https://linkedin.com/in/davidmartinez',
    email: 'david@skygear.com'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    role: 'Marketing Director',
    bio: 'Creative marketer connecting the skydiving community. Passionate about storytelling and brand building.',
    avatar: '/team/lisa.jpg',
    linkedin: 'https://linkedin.com/in/lisaanderson',
    email: 'lisa@skygear.com'
  }
]

export function TeamMembersShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextSlide = () => {
    if (teamMembers.length <= 3) return
    setCurrentIndex((prev) => {
      const maxIndex = teamMembers.length - 3
      return (prev + 1) % (maxIndex + 1)
    })
  }

  const prevSlide = () => {
    if (teamMembers.length <= 3) return
    setCurrentIndex((prev) => {
      const maxIndex = teamMembers.length - 3
      return (prev - 1 + maxIndex + 1) % (maxIndex + 1)
    })
  }

  const itemsToShow = Math.min(3, teamMembers.length)
  const visibleMembers = teamMembers.slice(currentIndex, currentIndex + itemsToShow)
  
  // Pad with empty items if needed for layout
  while (visibleMembers.length < 3 && visibleMembers.length < teamMembers.length) {
    visibleMembers.push(null as any)
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl">
              Passionate professionals dedicated to revolutionizing the skydiving gear marketplace
            </p>
          </div>
          {teamMembers.length > 3 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="rounded-full w-12 h-12 border-2 hover:bg-gray-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="rounded-full w-12 h-12 border-2 hover:bg-gray-50"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {visibleMembers.map((member: TeamMember | null, index: number) => {
            if (!member) return <div key={`empty-${index}`}></div>
            return (
              <Card key={member.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {member.avatar ? (
                        <Image
                          src={member.avatar}
                          alt={member.name}
                          width={128}
                          height={128}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-4xl font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-1">{member.name}</CardTitle>
                  <CardDescription className="text-base font-medium text-blue-600">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {member.bio}
                  </p>
                  <div className="flex justify-center gap-3 pt-2">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                      </a>
                    )}
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="h-4 w-4 text-gray-600 hover:text-blue-600" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

