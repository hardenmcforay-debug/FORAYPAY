import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg' | 'none'
  animate?: boolean
  delay?: 0 | 1 | 2 | 3
}

export default function Card({ children, className, padding = 'md', animate = true, delay = 0, ...props }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const animationClasses = animate
    ? delay === 0
      ? 'animate-card-fade-in'
      : delay === 1
      ? 'animate-card-fade-in-delay-1'
      : delay === 2
      ? 'animate-card-fade-in-delay-2'
      : 'animate-card-fade-in-delay-3'
    : ''

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg border-2 border-gray-300 card-hover-lift',
        animationClasses,
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

