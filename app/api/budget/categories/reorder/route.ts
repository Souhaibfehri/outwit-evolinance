import { NextRequest, NextResponse } from 'next/server'
import { getUserAndEnsure, updateUserMetadata } from '@/lib/ensureUser'
import { z } from 'zod'

const ReorderCategoriesSchema = z.object({
  categories: z.array(z.object({
    categoryId: z.string(),
    groupId: z.string().optional(),
    sortOrder: z.number()
  })),
  groups: z.array(z.object({
    groupId: z.string(),
    sortOrder: z.number()
  })).optional()
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserAndEnsure()
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ReorderCategoriesSchema.parse(body)

    const metadata = user.user_metadata || {}
    let categories = metadata.categories || []
    let categoryGroups = metadata.category_groups || []

    // Update category orders and group assignments
    for (const categoryUpdate of validatedData.categories) {
      const categoryIndex = categories.findIndex((cat: any) => cat.id === categoryUpdate.categoryId)
      if (categoryIndex >= 0) {
        categories[categoryIndex] = {
          ...categories[categoryIndex],
          groupId: categoryUpdate.groupId || categories[categoryIndex].groupId,
          sortOrder: categoryUpdate.sortOrder,
          updatedAt: new Date().toISOString()
        }
      }
    }

    // Update group orders if provided
    if (validatedData.groups) {
      for (const groupUpdate of validatedData.groups) {
        const groupIndex = categoryGroups.findIndex((group: any) => group.id === groupUpdate.groupId)
        if (groupIndex >= 0) {
          categoryGroups[groupIndex] = {
            ...categoryGroups[groupIndex],
            sortOrder: groupUpdate.sortOrder,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }

    const result = await updateUserMetadata({
      ...metadata,
      categories,
      category_groups: categoryGroups
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Categories reordered successfully'
    })

  } catch (error) {
    console.error('Error reordering categories:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid reorder data',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Failed to reorder categories'
    }, { status: 500 })
  }
}
