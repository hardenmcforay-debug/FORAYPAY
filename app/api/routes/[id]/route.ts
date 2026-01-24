import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Verify the requester is authenticated
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to verify role and company
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'company_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Company admin access required' },
        { status: 403 }
      )
    }

    if (!userProfile.company_id) {
      return NextResponse.json(
        { error: 'No company assigned to your account' },
        { status: 403 }
      )
    }

    // Get route details before deletion for audit log
    const { data: route } = await supabase
      .from('routes')
      .select('id, name, origin, destination, fare, company_id')
      .eq('id', params.id)
      .single()

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      )
    }

    // Verify the route belongs to the user's company
    if (route.company_id !== userProfile.company_id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete routes from your own company' },
        { status: 403 }
      )
    }

    // Delete route (cascading deletes will handle related tickets)
    const { error: deleteError } = await supabase
      .from('routes')
      .delete()
      .eq('id', params.id)
      .eq('company_id', userProfile.company_id)

    if (deleteError) {
      console.error('Error deleting route:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete route' },
        { status: 400 }
      )
    }

    // Log audit action
    await supabase.from('audit_logs').insert({
      user_id: authUser.id,
      company_id: userProfile.company_id,
      action: 'route_deleted',
      details: {
        route_id: route.id,
        route_name: route.name,
        origin: route.origin,
        destination: route.destination,
        fare: route.fare,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Route deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in delete route API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

