
import { describe, it, expect } from '@jest/globals'
import { 
  nextOccurrence, 
  occurrencesBetween, 
  matchesRecurrence,
  frequencyToString,
  toMonthlyAmount,
  daysUntilNext,
  createRecurrence,
  type Recurrence 
} from '../../lib/recurrence'

// Helper to create UTC dates consistently
const utcDate = (year: number, month: number, day: number) => 
  new Date(Date.UTC(year, month, day, 0, 0, 0, 0))

describe('Recurrence Engine', () => {
  describe('nextOccurrence', () => {
    it('should calculate next daily occurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'daily',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 0, 5)
      const next = nextOccurrence(recurrence, from)
      
      expect(next).toEqual(utcDate(2024, 0, 6))
    })

    it('should calculate next weekly occurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'weekly',
        interval: 1,
        startDate: utcDate(2024, 0, 1), // Monday
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 0, 5) // Friday
      const next = nextOccurrence(recurrence, from)
      
      expect(next).toEqual(utcDate(2024, 0, 8)) // Next Monday
    })

    it('should calculate next bi-weekly occurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'bi-weekly',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 0, 10)
      const next = nextOccurrence(recurrence, from)
      
      expect(next).toEqual(utcDate(2024, 0, 15))
    })

    it('should calculate next monthly occurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'monthly',
        interval: 1,
        startDate: utcDate(2024, 0, 15),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 0, 20)
      const next = nextOccurrence(recurrence, from)
      
      expect(next).toEqual(utcDate(2024, 1, 15))
    })

    it('should handle month-end edge cases', () => {
      const recurrence: Recurrence = {
        frequency: 'monthly',
        interval: 1,
        startDate: utcDate(2024, 0, 31), // January 31st
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 1, 1) // February 1st
      const next = nextOccurrence(recurrence, from)
      
      // February doesn't have 31 days, so it should go to March 31st
      expect(next?.getUTCDate()).toBe(31) // March has 31 days
      expect(next?.getUTCMonth()).toBe(2) // March (0-indexed)
    })

    it('should calculate next quarterly occurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'quarterly',
        interval: 1,
        startDate: utcDate(2024, 0, 15),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 1, 1)
      const next = nextOccurrence(recurrence, from)
      
      expect(next).toEqual(utcDate(2024, 3, 15))
    })

    it('should calculate next annual occurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'annual',
        interval: 1,
        startDate: utcDate(2024, 0, 15),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 5, 1)
      const next = nextOccurrence(recurrence, from)
      
      expect(next).toEqual(utcDate(2025, 0, 15))
    })

    it('should return null for inactive recurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'daily',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        active: false,
        timezone: 'UTC'
      }
      
      const next = nextOccurrence(recurrence, utcDate(2024, 0, 5))
      expect(next).toBeNull()
    })

    it('should return null when past end date', () => {
      const recurrence: Recurrence = {
        frequency: 'daily',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        endDate: utcDate(2024, 0, 10),
        active: true,
        timezone: 'UTC'
      }
      
      const next = nextOccurrence(recurrence, utcDate(2024, 0, 15))
      expect(next).toBeNull()
    })
  })

  describe('occurrencesBetween', () => {
    it('should return all occurrences in date range', () => {
      const recurrence: Recurrence = {
        frequency: 'weekly',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 0, 1)
      const to = utcDate(2024, 0, 31)
      const occurrences = occurrencesBetween(recurrence, from, to)
      
      expect(occurrences).toHaveLength(5) // 5 Mondays in January 2024 (1, 8, 15, 22, 29)
    })

    it('should handle empty ranges', () => {
      const recurrence: Recurrence = {
        frequency: 'monthly',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 0, 15)
      const to = utcDate(2024, 0, 20)
      const occurrences = occurrencesBetween(recurrence, from, to)
      
      expect(occurrences).toHaveLength(0)
    })
  })

  describe('toMonthlyAmount', () => {
    it('should convert weekly to monthly', () => {
      const weekly = toMonthlyAmount(100, 'weekly')
      expect(weekly).toBeCloseTo(433, 0) // ~4.33 weeks per month
    })

    it('should convert bi-weekly to monthly', () => {
      const biweekly = toMonthlyAmount(500, 'bi-weekly')
      expect(biweekly).toBeCloseTo(1085, 0) // ~2.17 bi-weekly periods per month
    })

    it('should keep monthly amounts unchanged', () => {
      const monthly = toMonthlyAmount(1000, 'monthly')
      expect(monthly).toBe(1000)
    })

    it('should convert annual to monthly', () => {
      const annual = toMonthlyAmount(12000, 'annual')
      expect(annual).toBe(1000) // 12000 / 12
    })
  })

  describe('frequencyToString', () => {
    it('should format frequencies correctly', () => {
      expect(frequencyToString('daily')).toBe('day')
      expect(frequencyToString('weekly')).toBe('week')
      expect(frequencyToString('monthly')).toBe('month')
      expect(frequencyToString('daily', 2)).toBe('every 2 days')
      expect(frequencyToString('weekly', 3)).toBe('every 3 weeks')
    })
  })

  describe('daysUntilNext', () => {
    it('should calculate days until next occurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'weekly',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        active: true,
        timezone: 'UTC'
      }
      
      const from = utcDate(2024, 0, 5) // Friday
      const days = daysUntilNext(recurrence, from)
      
      expect(days).toBe(3) // Until Monday Jan 8 (3 days from Friday Jan 5)
    })

    it('should return null for inactive recurrence', () => {
      const recurrence: Recurrence = {
        frequency: 'daily',
        interval: 1,
        startDate: utcDate(2024, 0, 1),
        active: false,
        timezone: 'UTC'
      }
      
      const days = daysUntilNext(recurrence, utcDate(2024, 0, 5))
      expect(days).toBeNull()
    })
  })

  describe('createRecurrence', () => {
    it('should create recurrence with defaults', () => {
      const startDate = utcDate(2024, 0, 1)
      const recurrence = createRecurrence('monthly', startDate)
      
      expect(recurrence).toEqual({
        frequency: 'monthly',
        interval: 1,
        startDate,
        active: true,
        timezone: 'UTC'
      })
    })

    it('should create recurrence with options', () => {
      const startDate = utcDate(2024, 0, 1)
      const endDate = utcDate(2024, 11, 31)
      const recurrence = createRecurrence('monthly', startDate, {
        interval: 2,
        byMonthDay: 15,
        endDate,
        timezone: 'America/New_York'
      })
      
      expect(recurrence).toEqual({
        frequency: 'monthly',
        interval: 2,
        byMonthDay: 15,
        startDate,
        endDate,
        active: true,
        timezone: 'America/New_York'
      })
    })
  })
})