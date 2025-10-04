/**
 * Utility functions for safely handling name operations
 * Prevents crashes when dealing with null/undefined/empty names
 */

/**
 * Safely extracts the first name from a full name
 * @param fullName - The full name string (can be null/undefined/empty)
 * @param fallback - Fallback value if fullName is invalid
 * @returns The first name or fallback value
 */
export function getFirstName(fullName: string | null | undefined, fallback: string = 'User'): string {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return fallback
  }
  
  const trimmedName = fullName.trim()
  const nameParts = trimmedName.split(' ')
  
  // Return first non-empty part
  return nameParts.find(part => part.length > 0) || fallback
}

/**
 * Safely extracts the last name from a full name
 * @param fullName - The full name string (can be null/undefined/empty)
 * @param fallback - Fallback value if fullName is invalid
 * @returns The last name or fallback value
 */
export function getLastName(fullName: string | null | undefined, fallback: string = ''): string {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return fallback
  }
  
  const trimmedName = fullName.trim()
  const nameParts = trimmedName.split(' ').filter(part => part.length > 0)
  
  // Return last part if there are multiple parts
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : fallback
}

/**
 * Safely gets initials from a full name
 * @param fullName - The full name string (can be null/undefined/empty)
 * @param maxInitials - Maximum number of initials to return
 * @returns String of initials or fallback
 */
export function getInitials(fullName: string | null | undefined, maxInitials: number = 2): string {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return 'U'
  }
  
  const trimmedName = fullName.trim()
  const nameParts = trimmedName.split(' ').filter(part => part.length > 0)
  
  if (nameParts.length === 0) {
    return 'U'
  }
  
  const initials = nameParts
    .slice(0, maxInitials)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
  
  return initials || 'U'
}

/**
 * Safely formats a name for display
 * @param fullName - The full name string (can be null/undefined/empty)
 * @param fallback - Fallback value if fullName is invalid
 * @returns Formatted name or fallback
 */
export function formatDisplayName(fullName: string | null | undefined, fallback: string = 'User'): string {
  if (!fullName || typeof fullName !== 'string' || fullName.trim() === '') {
    return fallback
  }
  
  return fullName.trim()
}

/**
 * Checks if a name is valid and not empty
 * @param fullName - The full name string to check
 * @returns True if name is valid and not empty
 */
export function isValidName(fullName: string | null | undefined): boolean {
  return fullName != null && typeof fullName === 'string' && fullName.trim().length > 0
}
