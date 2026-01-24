import Image, { ImageProps } from 'next/image'
import { getImageUrl } from '@/lib/supabase/storage'

interface HighQualityImageProps extends Omit<ImageProps, 'src'> {
  src: string
  useSupabase?: boolean
  quality?: number
}

/**
 * High-quality Image component wrapper that ensures optimal image rendering
 * - Uses quality=100 by default for maximum clarity
 * - Supports both local and Supabase storage images
 * - Automatically handles image optimization
 */
export default function HighQualityImage({
  src,
  useSupabase = false,
  quality = 100,
  ...props
}: HighQualityImageProps) {
  // If useSupabase is true, convert local path to Supabase URL
  const imageSrc = useSupabase && !src.startsWith('http') 
    ? getImageUrl(src.replace(/^\//, '')) 
    : src

  return (
    <Image
      src={imageSrc}
      quality={quality}
      {...props}
    />
  )
}

