import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'
import { validateUUID, validateCompanyName, validateStatus } from '@/lib/security/input-validator'
import { createErrorResponse } from '@/lib/security/error-handler'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    // Validate UUID parameter
    const companyId = validateUUID(params.id)
    if (!companyId) {
      return NextResponse.json(
        { error: 'Invalid company ID format' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', authUser.id)
      .single()

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { status, name } = body

    // Get company details before update for audit log
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, status')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Platform admin can update status
    if (userProfile.role === 'platform_admin') {
      const validatedStatus = validateStatus(status, ['active', 'suspended'])
      if (!validatedStatus) {
        return NextResponse.json(
          { error: 'Invalid status. Must be "active" or "suspended"' },
          { status: 400 }
        )
      }

      // Use admin client to update company status
      const supabaseAdmin = createSupabaseAdmin()

      const { error: updateError } = await supabaseAdmin
        .from('companies')
        .update({ status: validatedStatus })
        .eq('id', companyId)

      if (updateError) {
        console.error('Error updating company status:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update company status' },
          { status: 400 }
        )
      }

      // When company status changes, update all park operators accordingly
      if (validatedStatus === 'suspended') {
        // Suspend all park operators belonging to this company
        const { data: operators, error: operatorsError } = await supabaseAdmin
          .from('park_operators')
          .select('id, name, user_id, status')
          .eq('company_id', companyId)

        if (operatorsError) {
          console.error('Error fetching park operators:', operatorsError)
          // Continue even if we can't fetch operators - company suspension is still successful
        } else if (operators && operators.length > 0) {
          // Update all operators to suspended
          const { error: suspendOperatorsError } = await supabaseAdmin
            .from('park_operators')
            .update({ status: 'suspended' })
            .eq('company_id', companyId)

          if (suspendOperatorsError) {
            console.error('Error suspending park operators:', suspendOperatorsError)
            // Continue even if operator suspension fails - company suspension is still successful
          } else {
            // Log audit action for each operator suspended
            for (const operator of operators) {
              if (operator.status !== 'suspended') {
                await supabaseAdmin.from('audit_logs').insert({
                  user_id: authUser.id,
                  company_id: params.id,
                  action: 'park_operator_suspended',
                  details: {
                    operator_id: operator.id,
                    operator_name: operator.name,
                    reason: 'Company suspended',
                    previous_status: operator.status,
                    new_status: 'suspended',
                  },
                })
              }
            }
          }
        }
      } else if (validatedStatus === 'active') {
        // Activate all park operators belonging to this company
        const { data: operators, error: operatorsError } = await supabaseAdmin
          .from('park_operators')
          .select('id, name, user_id, status')
          .eq('company_id', companyId)

        if (operatorsError) {
          console.error('Error fetching park operators:', operatorsError)
          // Continue even if we can't fetch operators - company activation is still successful
        } else if (operators && operators.length > 0) {
          // Update all operators to active
          const { error: activateOperatorsError } = await supabaseAdmin
            .from('park_operators')
            .update({ status: 'active' })
            .eq('company_id', companyId)

          if (activateOperatorsError) {
            console.error('Error activating park operators:', activateOperatorsError)
            // Continue even if operator activation fails - company activation is still successful
          } else {
            // Log audit action for each operator activated
            for (const operator of operators) {
              if (operator.status !== 'active') {
                await supabaseAdmin.from('audit_logs').insert({
                  user_id: authUser.id,
                  company_id: params.id,
                  action: 'park_operator_activated',
                  details: {
                    operator_id: operator.id,
                    operator_name: operator.name,
                    reason: 'Company activated',
                    previous_status: operator.status,
                    new_status: 'active',
                  },
                })
              }
            }
          }
        }
      }

      // Log audit action for company status change
      await supabaseAdmin.from('audit_logs').insert({
        user_id: authUser.id,
        company_id: company.id,
        action: `company_${validatedStatus === 'active' ? 'activated' : 'suspended'}`,
        details: {
          company_id: company.id,
          company_name: company.name,
          previous_status: company.status,
          new_status: validatedStatus,
        },
      })

      return NextResponse.json({
        success: true,
        message: `Company ${validatedStatus === 'active' ? 'activated' : 'suspended'} successfully`,
      })
    }

    // Company admin can update company information (name, etc.)
    if (userProfile.role === 'company_admin') {
      // Verify the company admin owns this company
      if (userProfile.company_id !== companyId) {
        return NextResponse.json(
          { error: 'Forbidden: You can only update your own company' },
          { status: 403 }
        )
      }

      // Build update object with only allowed fields
      const updateData: { name?: string } = {}
      
      if (name !== undefined) {
        const validatedName = validateCompanyName(name)
        if (!validatedName) {
          return NextResponse.json(
            { error: 'Invalid company name format' },
            { status: 400 }
          )
        }
        updateData.name = validatedName
      }

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          { error: 'No valid fields to update' },
          { status: 400 }
        )
      }

      // Use admin client to update company (bypasses RLS to ensure update works)
      const supabaseAdmin = createSupabaseAdmin()
      
      const { error: updateError } = await supabaseAdmin
        .from('companies')
        .update(updateData)
        .eq('id', companyId)

      if (updateError) {
        console.error('Error updating company:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to update company' },
          { status: 400 }
        )
      }

      // Get updated company data for audit log
      const { data: updatedCompany } = await supabaseAdmin
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single()

      // Log audit action
      await supabaseAdmin.from('audit_logs').insert({
        user_id: authUser.id,
        company_id: company.id,
        action: 'company_updated',
        details: {
          company_id: company.id,
          company_name: updatedCompany?.name || company.name,
          previous_name: company.name,
          updated_fields: updateData,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Company information updated successfully',
      })
    }

    return NextResponse.json(
      { error: 'Forbidden: Insufficient permissions' },
      { status: 403 }
    )
  } catch (error: unknown) {
    return createErrorResponse(error, 500, 'company-update')
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    // Validate UUID parameter
    const companyId = validateUUID(params.id)
    if (!companyId) {
      return NextResponse.json(
        { error: 'Invalid company ID format' },
        { status: 400 }
      )
    }

    // Verify the requester is a platform admin
    const supabase = createServerSupabaseClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || userProfile.role !== 'platform_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      )
    }

    // Get company details before deletion for audit log
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Use admin client to delete company and all associated users
    const supabaseAdmin = createSupabaseAdmin()

    // Get all users associated with this company (company_admin and park_operator)
    const { data: companyUsers, error: usersFetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('company_id', companyId)

    if (usersFetchError) {
      console.error('Error fetching company users:', usersFetchError)
      return NextResponse.json(
        { error: 'Failed to fetch company users' },
        { status: 500 }
      )
    }

    // Delete all users from authentication (auth.users)
    const deletedUserIds: string[] = []
    if (companyUsers && companyUsers.length > 0) {
      for (const user of companyUsers) {
        try {
          // Use admin API to delete user from auth.users
          const { data, error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
          if (deleteAuthError) {
            console.error(`Error deleting auth user ${user.id}:`, deleteAuthError)
            // Continue with other users even if one fails
          } else {
            deletedUserIds.push(user.id)
            console.log(`Successfully deleted auth user: ${user.email} (${user.id})`)
          }
        } catch (err: any) {
          console.error(`Exception deleting auth user ${user.id}:`, err)
        }
      }
    }

    // Delete users from users table (in case some weren't deleted from auth)
    if (companyUsers && companyUsers.length > 0) {
      const { error: deleteUsersError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('company_id', companyId)

      if (deleteUsersError) {
        console.error('Error deleting users from users table:', deleteUsersError)
        // Continue with company deletion even if user deletion fails
      }
    }

    // Delete company (cascading deletes will handle related records like routes, operators, etc.)
    const { error: deleteError } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId)

    if (deleteError) {
      console.error('Error deleting company:', deleteError)
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete company' },
        { status: 400 }
      )
    }

    // Log audit action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: authUser.id,
      action: 'company_deleted',
      details: {
        company_id: company.id,
        company_name: company.name,
        deleted_users_count: companyUsers?.length || 0,
        deleted_user_ids: deletedUserIds,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Company deleted successfully',
    })
  } catch (error: unknown) {
    return createErrorResponse(error, 500, 'company-delete')
  }
}

