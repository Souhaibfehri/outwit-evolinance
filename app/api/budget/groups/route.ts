import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  icon: z.string().optional(),
  sortOrder: z.number().optional()
})

const UpdateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').optional(),
  icon: z.string().optional(),
  sortOrder: z.number().optional()
})

const DeleteGroupSchema = z.object({
  strategy: z.enum(['reassign', 'delete']),
  reassignToGroupId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateGroupSchema.parse(body)

    const metadata = user.user_metadata || {}
    const categoryGroups = metadata.category_groups || []

    // Check for duplicate names
    const existingGroup = categoryGroups.find((group: any) => 
      group.name.toLowerCase() === validatedData.name.toLowerCase()
    )
    if (existingGroup) {
      return NextResponse.json({
        success: false,
        error: 'A group with this name already exists'
      }, { status: 400 })
    }

    const newGroup = {
      id: `group_${Date.now()}`,
      userId: user.id,
      name: validatedData.name,
      icon: validatedData.icon || '📂',
      sortOrder: validatedData.sortOrder ?? categoryGroups.length,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedGroups = [...categoryGroups, newGroup]

    const result = await updateUserMetadata({
      ...metadata,
      category_groups: updatedGroups
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      group: newGroup,
      message: 'Group created successfully'
    })

  } catch (error) {
    console.error('Error creating group:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid group data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to create group'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')
    
    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = UpdateGroupSchema.parse(body)

    const metadata = user.user_metadata || {}
    let categoryGroups = metadata.category_groups || []

    const groupIndex = categoryGroups.findIndex((group: any) => group.id === groupId)
    if (groupIndex === -1) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    // Check for duplicate names (excluding current group)
    if (validatedData.name) {
      const existingGroup = categoryGroups.find((group: any, index: number) => 
        index !== groupIndex && group.name.toLowerCase() === validatedData.name.toLowerCase()
      )
      if (existingGroup) {
        return NextResponse.json({
          success: false,
          error: 'A group with this name already exists'
        }, { status: 400 })
      }
    }

    categoryGroups[groupIndex] = {
      ...categoryGroups[groupIndex],
      ...validatedData,
      updatedAt: new Date().toISOString()
    }

    const result = await updateUserMetadata({
      ...metadata,
      category_groups: categoryGroups
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      group: categoryGroups[groupIndex],
      message: 'Group updated successfully'
    })

  } catch (error) {
    console.error('Error updating group:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid group data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to update group'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')
    
    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Group ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = DeleteGroupSchema.parse(body)

    const metadata = user.user_metadata || {}
    let categoryGroups = metadata.category_groups || []
    let categories = metadata.categories || []

    const groupIndex = categoryGroups.findIndex((group: any) => group.id === groupId)
    if (groupIndex === -1) {
      return NextResponse.json({ success: false, error: 'Group not found' }, { status: 404 })
    }

    const group = categoryGroups[groupIndex]

    // Don't allow deleting default groups
    if (group.isDefault) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete default groups'
      }, { status: 400 })
    }

    // Handle categories in this group
    const categoriesInGroup = categories.filter((cat: any) => cat.groupId === groupId)
    
    if (categoriesInGroup.length > 0) {
      if (validatedData.strategy === 'reassign') {
        if (!validatedData.reassignToGroupId) {
          return NextResponse.json({
            success: false,
            error: 'Reassign target group ID is required'
          }, { status: 400 })
        }

        // Reassign categories to new group
        categories = categories.map((cat: any) => {
          if (cat.groupId === groupId) {
            return {
              ...cat,
              groupId: validatedData.reassignToGroupId,
              updatedAt: new Date().toISOString()
            }
          }
          return cat
        })
      } else {
        // Delete categories along with group
        categories = categories.filter((cat: any) => cat.groupId !== groupId)
      }
    }

    // Remove the group
    categoryGroups.splice(groupIndex, 1)

    const result = await updateUserMetadata({
      ...metadata,
      category_groups: categoryGroups,
      categories
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
      categoriesAffected: categoriesInGroup.length
    })

  } catch (error) {
    console.error('Error deleting group:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid delete data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to delete group'
    }, { status: 500 })
  }
}
