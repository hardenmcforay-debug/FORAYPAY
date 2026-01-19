-- Create Contact Requests Table
-- Run this script in Supabase SQL Editor to create the contact_requests table
-- This table stores company space setup requests from the contact page

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the contact_requests table
CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  business_registration_number VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  number_of_routes VARCHAR(50) NOT NULL,
  website VARCHAR(500),
  socials TEXT,
  additional_info TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'in_progress', 'completed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON contact_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON contact_requests(email);

-- Enable Row Level Security
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Only platform admins can view contact requests
CREATE POLICY "Platform admins can view all contact requests"
  ON contact_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

-- Policy: Platform admins can update contact requests
CREATE POLICY "Platform admins can update contact requests"
  ON contact_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

-- Policy: Anyone can insert contact requests (for the contact form)
CREATE POLICY "Anyone can insert contact requests"
  ON contact_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_contact_requests_updated_at ON contact_requests;
CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_requests_updated_at();

-- Add comments
COMMENT ON TABLE contact_requests IS 'Stores contact form submissions for company space setup requests';
COMMENT ON COLUMN contact_requests.status IS 'Status of the contact request: pending, contacted, in_progress, completed, rejected';
COMMENT ON COLUMN contact_requests.contacted_at IS 'Timestamp when the company was first contacted by platform admin';
COMMENT ON COLUMN contact_requests.legal_name IS 'Legal registered name of the company';
COMMENT ON COLUMN contact_requests.business_registration_number IS 'Official business registration number';
COMMENT ON COLUMN contact_requests.website IS 'Company website URL (optional)';
COMMENT ON COLUMN contact_requests.socials IS 'Social media handles/links (optional)';

-- Verify table was created
SELECT 'contact_requests table created successfully!' AS message;

