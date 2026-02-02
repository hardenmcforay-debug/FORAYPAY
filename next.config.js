/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Improve image quality
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    // Security: Mitigate Image Optimizer DoS vulnerability (GHSA-9g9p-9gw9-jx7f)
    // Restrict remotePatterns to only trusted domains with specific paths
    // Note: Next.js 14.x doesn't have built-in size limits, so we restrict domains strictly
    // For full fix, upgrade to Next.js 15.5.10+ or 16.1.5+
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
// Security: Only allow specific trusted domains with restricted paths to mitigate DoS
// The Image Optimizer DoS vulnerability (GHSA-9g9p-9gw9-jx7f) affects Next.js 14.x
// Full fix requires Next.js 15.5.10+ or 16.1.5+, but we mitigate by restricting domains
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

// Add your specific Supabase domain (replace with your actual domain if different)
// This is a fallback in case environment variable isn't loaded at build time
// Security: Only allow public storage paths, not the entire domain
remotePatterns.push({
  protocol: 'https',
  hostname: 'rwdjthkimcjbmhgorsxf.supabase.co',
  pathname: '/storage/v1/object/public/**',
})

nextConfig.images.remotePatterns = remotePatterns

module.exports = nextConfig

