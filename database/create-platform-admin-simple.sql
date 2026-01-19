-- ============================================
-- SIMPLE PLATFORM ADMIN CREATION SCRIPT
-- ============================================
-- Copy this entire block and replace YOUR_UUID_HERE and your values
-- Make sure to copy everything from INSERT to the semicolon (;)

INSERT INTO users (id, email, password_hash, full_name, role, is_active)
VALUES ('YOUR_UUID_HERE', 'your-email@example.com', '', 'Your Full Name', 'platform_admin', true)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, updated_at = NOW();

-- ============================================
-- EXAMPLE (replace with your actual values):
-- ============================================
-- INSERT INTO users (id, email, password_hash, full_name, role, is_active)
-- VALUES ('123e4567-e89b-12d3-a456-426614174000', 'harden@foraypay.com', '', 'Harden Mathew Condor Foray', 'platform_admin', true)
-- ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_active = EXCLUDED.is_active, updated_at = NOW();

