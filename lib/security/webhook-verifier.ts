/**
 * Webhook Signature Verification
 * 
 * Verifies webhook requests using HMAC signatures to prevent
 * unauthorized webhook calls.
 */

import crypto from 'crypto'

/**
 * Verify webhook signature using HMAC
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false
  }
  
  try {
    // Create HMAC hash
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(payload)
    const expectedSignature = hmac.digest('hex')
    
    // Use constant-time comparison to prevent timing attacks
    const providedSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

/**
 * Verify MoniMe webhook request
 */
export function verifyMoniMeWebhook(
  request: Request,
  body: string
): { valid: boolean; error?: string } {
  // Check for webhook secret header
  const webhookSecret = request.headers.get('x-monime-secret')
  const expectedSecret = process.env.MONIME_WEBHOOK_SECRET
  
  if (!webhookSecret || !expectedSecret) {
    return {
      valid: false,
      error: 'Missing webhook secret',
    }
  }
  
  // Verify secret matches
  if (webhookSecret !== expectedSecret) {
    return {
      valid: false,
      error: 'Invalid webhook secret',
    }
  }
  
  // Optional: Verify HMAC signature if provided
  const signature = request.headers.get('x-monime-signature')
  if (signature && expectedSecret) {
    const isValid = verifyWebhookSignature(body, signature, expectedSecret)
    if (!isValid) {
      return {
        valid: false,
        error: 'Invalid webhook signature',
      }
    }
  }
  
  return { valid: true }
}

