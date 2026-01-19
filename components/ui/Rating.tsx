import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingProps {
  rating: number
  maxRating?: number
  totalReviews?: number
  showReviews?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Rating({
  rating,
  maxRating = 5,
  totalReviews,
  showReviews = true,
  size = 'md',
  className
}: RatingProps) {
  const sizes = {
    sm: {
      star: 'h-3 w-3',
      text: 'text-xs',
      gap: 'gap-0.5'
    },
    md: {
      star: 'h-4 w-4',
      text: 'text-sm',
      gap: 'gap-1'
    },
    lg: {
      star: 'h-5 w-5',
      text: 'text-base',
      gap: 'gap-1.5'
    }
  }

  const currentSize = sizes[size]
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className={cn('flex items-center', currentSize.gap, className)}>
      {/* Stars */}
      <div className={cn('flex items-center', currentSize.gap)}>
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(currentSize.star, 'fill-warning-500 text-warning-500')}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative inline-block">
            <Star
              className={cn(currentSize.star, 'text-gray-300')}
            />
            <div className="absolute left-0 top-0 overflow-hidden" style={{ width: '50%' }}>
              <Star
                className={cn(currentSize.star, 'fill-warning-500 text-warning-500')}
              />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(currentSize.star, 'text-gray-300')}
          />
        ))}
      </div>

      {/* Rating number and reviews */}
      <div className={cn('flex items-center', currentSize.gap)}>
        <span className={cn('font-semibold text-gray-900', currentSize.text)}>
          {rating.toFixed(1)}
        </span>
        {showReviews && totalReviews && (
          <span className={cn('text-gray-600', currentSize.text)}>
            ({totalReviews.toLocaleString()} {totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>
    </div>
  )
}

