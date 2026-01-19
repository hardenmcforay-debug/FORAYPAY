-- Migration: Add new fields to contact_requests table
-- Run this if the contact_requests table already exists

-- Add new required columns
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(255);

-- Add new optional columns
ALTER TABLE contact_requests 
ADD COLUMN IF NOT EXISTS website VARCHAR(500),
ADD COLUMN IF NOT EXISTS socials TEXT;

-- Update existing rows to have default values for required fields (if any exist)
-- Note: You may need to manually update existing rows with actual data
UPDATE contact_requests 
SET legal_name = company_name 
WHERE legal_name IS NULL;

UPDATE contact_requests 
SET business_registration_number = 'N/A' 
WHERE business_registration_number IS NULL;

-- Make the new required fields NOT NULL after setting defaults
-- Only do this if you've updated all existing rows
-- ALTER TABLE contact_requests 
-- ALTER COLUMN legal_name SET NOT NULL,
-- ALTER COLUMN business_registration_number SET NOT NULL;

-- Comments
COMMENT ON COLUMN contact_requests.legal_name IS 'Legal registered name of the company';
COMMENT ON COLUMN contact_requests.business_registration_number IS 'Official business registration number';
COMMENT ON COLUMN contact_requests.website IS 'Company website URL (optional)';
COMMENT ON COLUMN contact_requests.socials IS 'Social media handles/links (optional)';

