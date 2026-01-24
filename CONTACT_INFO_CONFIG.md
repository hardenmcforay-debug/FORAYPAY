# Contact Information Configuration

## Update Contact Details

To update the contact information on the sign-in pages, edit the following files:

### 1. Regular Login Page
**File**: `app/(auth)/login/page.tsx`

### 2. Admin Login Page
**File**: `app/(auth)/admin/login/page.tsx`

## Contact Information to Update

### WhatsApp
```tsx
href="https://wa.me/232XXXXXXXXX"
```
Replace `232XXXXXXXXX` with your actual WhatsApp number (with country code, no + sign).

**Example**: 
- If your number is +232 76 123 4567
- Use: `https://wa.me/232761234567`

### Email
```tsx
href="mailto:support@foraypay.com"
```
Replace `support@foraypay.com` with your actual support email.

## Current Configuration

- **WhatsApp**: `https://wa.me/232XXXXXXXXX` (placeholder - needs update)
- **Email**: `support@foraypay.com` (placeholder - needs update)

## Location

The Contact Us section appears at the **bottom left** of both login pages:
- Regular login: `/login`
- Admin login: `/admin/login`

## Visibility

- **Desktop/Tablet**: Always visible
- **Mobile**: Hidden (to avoid interfering with login form)

## Styling

The contact section features:
- White background with shadow
- Rounded corners
- Hover effects on links
- Icon buttons for WhatsApp and Email
- Responsive sizing

---

**Note**: Remember to update both login pages with the same contact information for consistency.

