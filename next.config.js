/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable Turbopack for production builds to ensure compatibility
  experimental: {
    turbo: false,
  },
  // Use webpack for better module resolution compatibility
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution
    config.resolve = {
      ...config.resolve,
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    }
    return config
  },
  images: {
    // Improve image quality
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Security: Image Optimizer DoS vulnerability (GHSA-9g9p-9gw9-jx7f) fixed in Next.js 15.5.10+
    // Restrict remotePatterns to only trusted domains with specific paths
    // Note: Using Next.js 15.5.11 which includes the security fix
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
// Security: Only allow specific trusted domains with restricted paths
// Using Next.js 15.5.11 which includes the Image Optimizer DoS fix (GHSA-9g9p-9gw9-jx7f)
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'framerusercontent.com',
    pathname: '/**',
  },
]

// Add Supabase storage domain from environment variable
// Restrict to only the storage/public path to minimize attack surface
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
    remotePatterns.push({
      protocol: 'https',
      hostname: supabaseUrl.hostname,
      // Restrict to only public storage paths - more secure than /**
      pathname: '/storage/v1/object/public/**',
    })
    console.log('✓ Added Supabase storage domain to image config:', supabaseUrl.hostname)
  } catch (error) {
    console.warn('⚠ Failed to parse NEXT_PUBLIC_SUPABASE_URL for image configuration:', error)
  }
} else {
  console.warn('⚠ NEXT_PUBLIC_SUPABASE_URL not found in environment variables')
}

nextConfig.images.remotePatterns = remotePatterns

module.exports = nextConfig

