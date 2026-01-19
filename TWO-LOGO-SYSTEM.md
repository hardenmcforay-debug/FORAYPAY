# Two Logo System Documentation

## Overview

The system now supports **two independent logos** that can be displayed simultaneously:

1. **Navigation Bar Logo** - Small logo in the top navigation
2. **Hero Section Logo** - Large logo in the hero section

## Logo Locations

### Navigation Bar Logo
- **Primary path:** `landing-images/logo/nav-logo.png`
- **Fallback path:** `landing-images/logo/logo.png`
- **Public folder fallback:** `/logo.png`
- **Recommended size:** 200x200px or 300x100px
- **Usage:** Small icon in navigation bar, visible on all pages

### Hero Section Logo
- **Path:** `landing-images/logo/foraypay-logo.png`
- **Recommended size:** 1200x600px (2:1 aspect ratio)
- **Usage:** Large prominent logo in hero section of landing page

## How It Works

### Landing Page (`app/landing/page.tsx`)
- Fetches both logos from Supabase Storage
- Passes `navLogoUrl` to `<LandingNav>` component
- Passes `heroLogoUrl` to `<LandingLogo>` component

### Navigation Component (`components/layout/LandingNav.tsx`)
- Accepts optional `logoUrl` prop
- If prop provided, uses it directly
- If not provided, fetches from Supabase (nav-logo.png → logo.png → /logo.png)
- Displays logo in navigation bar

### Hero Logo Component (`components/features/LandingLogo.tsx`)
- Accepts `logoUrl` prop (required)
- Displays large logo in hero section
- Has fallback to text-based logo if image fails

## Upload Instructions

### Step 1: Upload Navigation Logo
1. Go to Supabase Dashboard → Storage → `landing-images` bucket
2. Navigate to `logo` folder (create if needed)
3. Upload your navigation logo as `nav-logo.png`
4. Or use `logo.png` as fallback name

### Step 2: Upload Hero Logo
1. In the same `logo` folder
2. Upload your hero logo as `foraypay-logo.png`

### File Structure
```
Supabase Storage:
landing-images/
  └── logo/
      ├── nav-logo.png        ← Navigation bar logo
      └── foraypay-logo.png   ← Hero section logo
```

## Code Examples

### Landing Page Implementation
```typescript
// Fetch both logos
const { data: navLogoData } = supabase.storage
  .from('landing-images')
  .getPublicUrl('logo/nav-logo.png')

const { data: heroLogoData } = supabase.storage
  .from('landing-images')
  .getPublicUrl('logo/foraypay-logo.png')

// Pass to components
<LandingNav logoUrl={navLogoData?.publicUrl || null} />
<LandingLogo logoUrl={heroLogoData?.publicUrl || null} />
```

### Using LandingNav Without Prop
```typescript
// Will automatically fetch nav-logo.png or logo.png
<LandingNav />
```

## Benefits

1. **Flexibility** - Use different logos optimized for each location
2. **Performance** - Smaller nav logo loads faster
3. **Design** - Nav logo can be simplified, hero logo can be detailed
4. **Backward Compatible** - Works with existing single logo setup

## Troubleshooting

### Navigation Logo Not Showing
- Check: `logo/nav-logo.png` or `logo/logo.png` exists
- Verify bucket is public
- Check browser console for errors

### Hero Logo Not Showing
- Check: `logo/foraypay-logo.png` exists
- Verify bucket is public
- Check browser console for errors

### Both Logos Not Showing
- Verify Supabase Storage bucket `landing-images` exists
- Check that `logo` folder exists in the bucket
- Ensure bucket has public read access
- Check file names are exactly as specified (case-sensitive)

## Notes

- Both logos support fallback mechanisms
- Images are optimized using Next.js Image component
- Logos scale responsively on all screen sizes
- System gracefully handles missing images with icon/text fallbacks

