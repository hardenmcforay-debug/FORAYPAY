/**
 * MoniMe API Client
 * 
 * This client handles communication with the MoniMe API for route synchronization,
 * transaction verification, balance checks, and refunds.
 */

interface MoniMeClientConfig {
  apiUrl: string
  apiKey: string
  authScheme?: string
}

interface MoniMeRoute {
  id?: string
  route_id?: string
  route_name?: string
  name?: string
  origin: string
  destination: string
  fareAmount?: number
  fare_amount?: number
  spaceId?: string
  [key: string]: any // Allow additional properties
}

interface MoniMeClient {
  createRoute(route: MoniMeRoute, spaceId?: string): Promise<any>
  updateRoute(routeId: string, route: MoniMeRoute, spaceId?: string): Promise<any>
  deleteRoute(routeId: string, spaceId?: string): Promise<any>
  getBalance(spaceId?: string): Promise<{ success: boolean; balance?: number; currency?: string; available_balance?: number; pending_balance?: number; error?: string }>
  verifyTransaction(transactionId: string, spaceId?: string): Promise<any>
  processRefund(refundData: { transaction_id: string; amount: number; reason?: string }, spaceId?: string): Promise<{ success: boolean; refund_id?: string; refund_amount?: number; error?: string }>
}

export function createMoniMeClient(): MoniMeClient {
  const apiUrl = process.env.MONIME_API_URL || 'https://api.monime.io/v1'
  const apiKey = process.env.MONIME_API_KEY || ''
  const authScheme = process.env.MONIME_AUTH_SCHEME || 'Bearer'

  // Normalize API URL (ensure it ends with /v1)
  const normalizedUrl = apiUrl.endsWith('/v1') ? apiUrl : `${apiUrl.replace(/\/$/, '')}/v1`

  if (!apiKey) {
    console.warn('MoniMe API key not configured. MoniMe features will be disabled.')
  }

  const makeRequest = async (
    method: string,
    endpoint: string,
    body?: any,
    spaceId?: string
  ): Promise<any> => {
    if (!apiKey) {
      throw new Error('MoniMe API key not configured')
    }

    const url = `${normalizedUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `${authScheme} ${apiKey}`,
    }

    if (spaceId) {
      headers['Monime-Space-Id'] = spaceId
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`MoniMe API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  return {
    async createRoute(route: MoniMeRoute, spaceId?: string) {
      return makeRequest('POST', '/routes', route, spaceId)
    },

    async updateRoute(routeId: string, route: MoniMeRoute, spaceId?: string) {
      return makeRequest('PUT', `/routes/${routeId}`, route, spaceId)
    },

    async deleteRoute(routeId: string, spaceId?: string) {
      return makeRequest('DELETE', `/routes/${routeId}`, undefined, spaceId)
    },

    async getBalance(spaceId?: string) {
      try {
        const result = await makeRequest('GET', '/balance', undefined, spaceId)
        return {
          success: true,
          balance: result.balance,
          currency: result.currency || 'SLL',
          available_balance: result.available_balance,
          pending_balance: result.pending_balance,
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get balance',
        }
      }
    },

    async verifyTransaction(transactionId: string, spaceId?: string) {
      try {
        return await makeRequest('GET', `/transactions/${transactionId}/verify`, undefined, spaceId)
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to verify transaction',
        }
      }
    },

    async processRefund(refundData: { transaction_id: string; amount: number; reason?: string }, spaceId?: string) {
      try {
        const result = await makeRequest('POST', `/transactions/${refundData.transaction_id}/refund`, {
          amount: refundData.amount,
          reason: refundData.reason,
        }, spaceId)
        return {
          success: true,
          refund_id: result.refund_id || result.id,
          refund_amount: result.refund_amount || refundData.amount,
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to process refund',
        }
      }
    },
  }
}

