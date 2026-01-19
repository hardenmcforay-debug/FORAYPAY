'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  Building2,
  BarChart3,
  Route,
  Users,
  Lock,
  Shield,
  LucideIcon
} from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  color: string
  bgColor: string
}

const features: Feature[] = [
  {
    icon: Building2,
    title: 'Multi-Tenant System',
    description: 'Each company operates in complete isolation. Your data is yours alone.',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Dashboards',
    description: 'See revenue by route, daily totals, and commission breakdowns instantly.',
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
  {
    icon: Route,
    title: 'Route Management',
    description: 'Manage routes, set fares, and track performance per route.',
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  {
    icon: Users,
    title: 'Operator Control',
    description: 'Assign park operators to routes and monitor validation activity.',
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  {
    icon: Lock,
    title: 'Server-Controlled Tickets',
    description: 'Tickets are single-use and server-validated. No screenshots, no fraud.',
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    icon: Shield,
    title: 'Full Audit Trail',
    description: 'Every transaction, validation, and action is logged and auditable.',
    color: 'text-success-600',
    bgColor: 'bg-success-50',
  },
]

export default function FeatureCards() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())

  useEffect(() => {
    const observers = cardRefs.current.map((cardRef, index) => {
      if (!cardRef) return null

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisibleCards((prev) => new Set(prev).add(index))
              // Don't disconnect, keep observing for scroll animations
            }
          })
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px',
        }
      )

      observer.observe(cardRef)
      return observer
    })

    return () => {
      observers.forEach((observer) => {
        if (observer) observer.disconnect()
      })
    }
  }, [])

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-8">
      {features.map((feature, index) => {
        const Icon = feature.icon
        const isVisible = visibleCards.has(index)
        
        return (
          <div
            key={index}
            ref={(el) => {
              cardRefs.current[index] = el
            }}
            className={`
              bg-white rounded-lg p-2 md:p-5 
              shadow-md hover:shadow-xl hover:-translate-y-2 
              transition-all duration-300 cursor-pointer 
              border border-gray-200 hover:border-gray-300
              group
              ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }
            `}
            style={{
              transitionDelay: isVisible ? `${index * 100}ms` : '0ms',
            }}
          >
            <div
              className={`
                ${feature.bgColor} w-8 h-8 md:w-10 md:h-10 rounded-lg 
                flex items-center justify-center mb-2 md:mb-3 
                group-hover:scale-110 group-hover:rotate-3 
                transition-transform duration-300
                ${
                  isVisible
                    ? 'scale-100 rotate-0'
                    : 'scale-75 rotate-12'
                }
              `}
              style={{
                transitionDelay: isVisible ? `${index * 100 + 150}ms` : '0ms',
              }}
            >
              <Icon
                className={`
                  h-4 w-4 md:h-5 md:w-5 ${feature.color} 
                  group-hover:scale-110 
                  transition-transform duration-300
                  ${
                    isVisible
                      ? 'scale-100'
                      : 'scale-50'
                  }
                `}
                style={{
                  transitionDelay: isVisible ? `${index * 100 + 200}ms` : '0ms',
                }}
              />
            </div>
            <h3
              className={`
                text-xs md:text-base font-semibold text-gray-900 mb-1 md:mb-2 
                group-hover:text-gray-800 
                transition-colors duration-300
                ${
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 -translate-x-4'
                }
              `}
              style={{
                transitionDelay: isVisible ? `${index * 100 + 250}ms` : '0ms',
              }}
            >
              {feature.title}
            </h3>
            <p
              className={`
                text-[10px] md:text-sm text-gray-600 leading-tight
                group-hover:text-gray-700 
                transition-colors duration-300
                ${
                  isVisible
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-4'
                }
              `}
              style={{
                transitionDelay: isVisible ? `${index * 100 + 300}ms` : '0ms',
              }}
            >
              {feature.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}
