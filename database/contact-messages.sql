-- Create contact_messages table for storing messages from the contact page
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Create updated_at trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contact_messages_updated_at
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Platform admins can read all messages
CREATE POLICY "Platform admins can view all contact messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

-- Policy: Service role can insert messages (for API)
CREATE POLICY "Service role can insert contact messages"
  ON contact_messages
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can read all messages
CREATE POLICY "Service role can read all contact messages"
  ON contact_messages
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Platform admins can update message status
CREATE POLICY "Platform admins can update contact messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'platform_admin'
    )
  );

-- Add comments to table and columns for documentation
COMMENT ON TABLE contact_messages IS 'Stores messages submitted through the contact page';
COMMENT ON COLUMN contact_messages.id IS 'Unique identifier for each message';
COMMENT ON COLUMN contact_messages.name IS 'Name of the person sending the message';
COMMENT ON COLUMN contact_messages.email IS 'Email address of the sender';
COMMENT ON COLUMN contact_messages.phone IS 'Phone number of the sender (optional)';
COMMENT ON COLUMN contact_messages.subject IS 'Subject/title of the message';
COMMENT ON COLUMN contact_messages.message IS 'The message content';
COMMENT ON COLUMN contact_messages.status IS 'Status of the message: unread, read, replied, or archived';
COMMENT ON COLUMN contact_messages.created_at IS 'Timestamp when the message was created';
COMMENT ON COLUMN contact_messages.updated_at IS 'Timestamp when the message was last updated';

