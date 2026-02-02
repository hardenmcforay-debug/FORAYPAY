/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Improve image quality
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Security: Limit image optimization to prevent DoS
    // Disable image optimization for maximum quality (optional - can be re-enabled)
    // unoptimized: false,
    // Use specific remotePatterns to prevent DoS attacks
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'framerusercontent.com',
        pathname: '/**',
      },
    ],
    // Add content security for image optimization
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

// Add Supabase storage to allowed image domains
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'framerusercontent.com',
    pathname: '/**',
  },
]

// Add Supabase storage domain from environment variable
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    remotePatterns.push({
      protocol: 'https',
      hostname: supabaseUrl.hostname,
      pathname: '/storage/v1/object/public/**',
    })
    console.log('✓ Added Supabase storage domain to image config:', supabaseUrl.hostname)
  } catch (error) {
    console.warn('⚠ Failed to parse NEXT_PUBLIC_SUPABASE_URL for image configuration:', error)
  }
} else {
  console.warn('⚠ NEXT_PUBLIC_SUPABASE_URL not found in environment variables')
}

// Add your specific Supabase domain (replace with your actual domain if different)
// This is a fallback in case environment variable isn't loaded at build time
remotePatterns.push({
  protocol: 'https',
  hostname: 'rwdjthkimcjbmhgorsxf.supabase.co',
  pathname: '/storage/v1/object/public/**',
})

nextConfig.images.remotePatterns = remotePatterns

module.exports = nextConfig

