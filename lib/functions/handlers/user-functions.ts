/**
 * User Information Function Handlers
 * 
 * Implements the actual getUserInfo function that integrates with 
 * the existing user API endpoints.
 */

import { FunctionCallContext } from '@/lib/functions/types'

export interface UserInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  createdAt: string
  updatedAt?: string
}

/**
 * Get current user information
 * Requires authentication - returns information for the authenticated user only
 */
export async function getUserInfo(
  parameters: {},
  context: FunctionCallContext
): Promise<UserInfo> {
  // Ensure user is authenticated
  if (!context.isAuthenticated || !context.user) {
    throw new Error('Authentication required to access user information')
  }

  try {
    // In our current implementation, we already have the user info from context
    // In a real production app, this might make an API call to get fresh data
    const userInfo: UserInfo = {
      id: context.user.id,
      email: context.user.email,
      firstName: context.user.firstName,
      lastName: context.user.lastName,
      createdAt: context.user.createdAt,
      updatedAt: context.user.updatedAt
    }

    // Simulate fetching additional user data that might not be in the JWT token
    const additionalUserData = await fetchUserFromStorage(context.user.id)
    
    if (additionalUserData) {
      return {
        ...userInfo,
        ...additionalUserData
      }
    }

    return userInfo

  } catch (error) {
    console.error('Error fetching user info:', error)
    
    // If storage fails, we can still return the context user data as fallback
    // Only throw if we have no user data at all
    if (context.user) {
      return {
        id: context.user.id,
        email: context.user.email,
        firstName: context.user.firstName,
        lastName: context.user.lastName,
        createdAt: context.user.createdAt,
        updatedAt: context.user.updatedAt
      }
    }
    
    throw new Error('Failed to retrieve user information')
  }
}

/**
 * Fetch user data from storage (simulates database call)
 * In production, this would be a proper database query
 */
async function fetchUserFromStorage(userId: string): Promise<Partial<UserInfo> | null> {
  try {
    // Simulate the same localStorage approach used in the auth endpoints
    const users = JSON.parse(globalThis.localStorage?.getItem("skyBooker_users") || "[]")
    const user = users.find((u: any) => u.id === userId)

    if (!user) {
      return null
    }

    // Remove sensitive fields and return clean user data
    const { password, ...cleanUserData } = user
    return cleanUserData

  } catch (error) {
    console.error('Error fetching user from storage:', error)
    return null
  }
}

/**
 * Format user information for assistant display
 * Formats the user data in a way that's helpful for the assistant to present
 */
export function formatUserInfoForDisplay(userInfo: UserInfo): string {
  return `Here's your account information:

**Personal Details:**
- Name: ${userInfo.firstName} ${userInfo.lastName}
- Email: ${userInfo.email}
- Account ID: ${userInfo.id}

**Account Status:**
- Member since: ${new Date(userInfo.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}
${userInfo.updatedAt ? `- Last updated: ${new Date(userInfo.updatedAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}` : ''}

Is there anything specific about your account you'd like to know more about?`
}

/**
 * Validate user access permissions
 * Ensures users can only access their own information
 */
export function validateUserAccess(requestedUserId: string, context: FunctionCallContext): boolean {
  if (!context.isAuthenticated || !context.user) {
    return false
  }

  // Users can only access their own information
  return context.user.id === requestedUserId
}

/**
 * Get user statistics (for internal use)
 * Could be extended to provide account statistics to the user
 */
export async function getUserStatistics(userId: string): Promise<{
  totalBookings: number
  membershipDuration: string
  lastLoginDate?: string
}> {
  try {
    // This would typically fetch from multiple data sources
    // For now, we'll return mock statistics
    
    const user = await fetchUserFromStorage(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const memberSince = new Date(user.createdAt!)
    const now = new Date()
    const membershipDays = Math.floor((now.getTime() - memberSince.getTime()) / (1000 * 60 * 60 * 24))
    
    let membershipDuration: string
    if (membershipDays < 30) {
      membershipDuration = `${membershipDays} days`
    } else if (membershipDays < 365) {
      const months = Math.floor(membershipDays / 30)
      membershipDuration = `${months} months`
    } else {
      const years = Math.floor(membershipDays / 365)
      membershipDuration = `${years} years`
    }

    return {
      totalBookings: 0, // Would fetch from bookings API
      membershipDuration,
      lastLoginDate: undefined // Would track login sessions
    }

  } catch (error) {
    console.error('Error fetching user statistics:', error)
    throw new Error('Failed to retrieve user statistics')
  }
}