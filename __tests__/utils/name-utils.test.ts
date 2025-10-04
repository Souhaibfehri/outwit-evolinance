import { getFirstName, getLastName, getInitials, formatDisplayName, isValidName } from '@/lib/utils/name-utils'

describe('Name Utils', () => {
  describe('getFirstName', () => {
    it('should extract first name from valid full name', () => {
      expect(getFirstName('John Doe')).toBe('John')
      expect(getFirstName('Mary Jane Smith')).toBe('Mary')
    })

    it('should handle single name', () => {
      expect(getFirstName('John')).toBe('John')
    })

    it('should handle null/undefined/empty values', () => {
      expect(getFirstName(null)).toBe('User')
      expect(getFirstName(undefined)).toBe('User')
      expect(getFirstName('')).toBe('User')
      expect(getFirstName('   ')).toBe('User')
    })

    it('should use custom fallback', () => {
      expect(getFirstName(null, 'Guest')).toBe('Guest')
      expect(getFirstName('', 'Anonymous')).toBe('Anonymous')
    })

    it('should handle names with extra spaces', () => {
      expect(getFirstName('  John   Doe  ')).toBe('John')
    })
  })

  describe('getLastName', () => {
    it('should extract last name from valid full name', () => {
      expect(getLastName('John Doe')).toBe('Doe')
      expect(getLastName('Mary Jane Smith')).toBe('Smith')
    })

    it('should return empty for single name', () => {
      expect(getLastName('John')).toBe('')
    })

    it('should handle null/undefined/empty values', () => {
      expect(getLastName(null)).toBe('')
      expect(getLastName(undefined)).toBe('')
      expect(getLastName('')).toBe('')
    })

    it('should use custom fallback', () => {
      expect(getLastName('John', 'Unknown')).toBe('Unknown')
    })
  })

  describe('getInitials', () => {
    it('should extract initials from valid full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Mary Jane Smith')).toBe('MJ')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should handle null/undefined/empty values', () => {
      expect(getInitials(null)).toBe('U')
      expect(getInitials(undefined)).toBe('U')
      expect(getInitials('')).toBe('U')
    })

    it('should respect max initials limit', () => {
      expect(getInitials('John Doe Smith Wilson', 2)).toBe('JD')
      expect(getInitials('John Doe Smith Wilson', 3)).toBe('JDS')
    })
  })

  describe('formatDisplayName', () => {
    it('should return trimmed name for valid input', () => {
      expect(formatDisplayName('John Doe')).toBe('John Doe')
      expect(formatDisplayName('  Mary Jane  ')).toBe('Mary Jane')
    })

    it('should handle null/undefined/empty values', () => {
      expect(formatDisplayName(null)).toBe('User')
      expect(formatDisplayName(undefined)).toBe('User')
      expect(formatDisplayName('')).toBe('User')
    })

    it('should use custom fallback', () => {
      expect(formatDisplayName(null, 'Guest')).toBe('Guest')
    })
  })

  describe('isValidName', () => {
    it('should return true for valid names', () => {
      expect(isValidName('John Doe')).toBe(true)
      expect(isValidName('Mary')).toBe(true)
      expect(isValidName('  John  ')).toBe(true)
    })

    it('should return false for invalid names', () => {
      expect(isValidName(null)).toBe(false)
      expect(isValidName(undefined)).toBe(false)
      expect(isValidName('')).toBe(false)
      expect(isValidName('   ')).toBe(false)
    })
  })
})
