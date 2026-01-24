/**
 * MoniMe Internal Transfer Utility
 * 
 * Handles automatic internal transfers from company accounts to platform account
 * for commission settlement after ticket sales.
 */

interface TransferRequest {
  from_account_id: string
  to_account_id: string
  amount: number
  reference: string
  description?: string
}

interface TransferResponse {
  success: boolean
  transfer_id?: string
  message?: string
  error?: string
}

/**
 * Initiate an internal transfer from company MoniMe account to platform MoniMe account
 * 
 * @param fromAccountId - Company's MoniMe account ID
 * @param toAccountId - Platform's MoniMe account ID
 * @param amount - Transfer amount (commission)
 * @param reference - Transaction reference (ticket ID or transaction ID)
 * @param description - Optional description
 * @returns Transfer response with success status and transfer ID
 */
export async function initiateInternalTransfer(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  reference: string,
  description?: string
): Promise<TransferResponse> {
  try {
    const monimeApiUrl = process.env.MONIME_API_URL || 'https://api.monime.com'
    const monimeApiKey = process.env.MONIME_API_KEY

    if (!monimeApiKey) {
      console.error('MoniMe API key not configured')
      return {
        success: false,
        error: 'MoniMe API not configured',
      }
    }

    if (!fromAccountId || !toAccountId) {
      console.error('Missing account IDs for transfer', { fromAccountId, toAccountId })
      return {
        success: false,
        error: 'Missing account IDs',
      }
    }

    if (amount <= 0) {
      console.error('Invalid transfer amount', { amount })
      return {
        success: false,
        error: 'Invalid transfer amount',
      }
    }

    // Call MoniMe API to initiate internal transfer
    const transferRequest: TransferRequest = {
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
      reference: reference,
      description: description || `Commission transfer for transaction ${reference}`,
    }

    console.log('Initiating MoniMe internal transfer:', {
      from: fromAccountId,
      to: toAccountId,
      amount: transferRequest.amount,
      reference,
    })

    const response = await fetch(`${monimeApiUrl}/api/v1/transfers/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${monimeApiKey}`,
      },
      body: JSON.stringify(transferRequest),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('MoniMe transfer API error:', {
        status: response.status,
        error: errorData,
      })
      
      return {
        success: false,
        error: errorData.message || `Transfer failed with status ${response.status}`,
      }
    }

    const data = await response.json()
    
    console.log('MoniMe transfer successful:', {
      transfer_id: data.transfer_id,
      reference,
      amount: transferRequest.amount,
    })

    return {
      success: true,
      transfer_id: data.transfer_id || data.id,
      message: data.message || 'Transfer initiated successfully',
    }
  } catch (error: any) {
    console.error('Error initiating MoniMe transfer:', error)
    return {
      success: false,
      error: error.message || 'Failed to initiate transfer',
    }
  }
}

