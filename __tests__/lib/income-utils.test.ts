import { calculateMonthlyIncome, calculateNextPaymentDate } from '@/lib/income-utils'

describe('Income Utils', () => {
  describe('calculateMonthlyIncome', () => {
    it('should calculate monthly income from recurring sources', () => {
      const recurringIncome = [
        { amountCents: 400000, frequency: 'monthly', active: true }, // $4000/month
        { amountCents: 100000, frequency: 'biweekly', active: true }, // $1000 bi-weekly = $2170/month
        { amountCents: 50000, frequency: 'weekly', active: true }, // $500 weekly = $2165/month
      ]
      const oneOffIncome = []

      const result = calculateMonthlyIncome(recurringIncome, oneOffIncome)
      
      // Should be approximately $8335/month
      expect(result).toBeGreaterThan(830000) // $8300
      expect(result).toBeLessThan(840000) // $8400
    })

    it('should exclude inactive recurring income', () => {
      const recurringIncome = [
        { amountCents: 400000, frequency: 'monthly', active: true },
        { amountCents: 200000, frequency: 'monthly', active: false }, // Should be excluded
      ]
      const oneOffIncome = []

      const result = calculateMonthlyIncome(recurringIncome, oneOffIncome)
      
      expect(result).toBe(400000) // Only active income
    })

    it('should include current month one-off income', () => {
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const currentMonthDate = new Date(currentYear, currentMonth, 15)

      const recurringIncome = []
      const oneOffIncome = [
        { amountCents: 100000, date: currentMonthDate.toISOString() }, // $1000 this month
        { amountCents: 50000, date: new Date(2023, 0, 15).toISOString() }, // $500 in January 2023 (should be excluded)
      ]

      const result = calculateMonthlyIncome(recurringIncome, oneOffIncome)
      
      expect(result).toBe(100000) // Only current month one-off
    })
  })

  describe('calculateNextPaymentDate', () => {
    it('should calculate next weekly payment', () => {
      const currentDate = new Date('2024-01-01')
      const nextDate = calculateNextPaymentDate('weekly', currentDate)
      
      expect(nextDate.getDate()).toBe(8) // 7 days later
    })

    it('should calculate next monthly payment', () => {
      const currentDate = new Date('2024-01-15')
      const nextDate = calculateNextPaymentDate('monthly', currentDate)
      
      expect(nextDate.getMonth()).toBe(1) // February
      expect(nextDate.getDate()).toBe(15) // Same day
    })

    it('should calculate next biweekly payment', () => {
      const currentDate = new Date('2024-01-01')
      const nextDate = calculateNextPaymentDate('biweekly', currentDate)
      
      expect(nextDate.getDate()).toBe(15) // 14 days later
    })
  })
})
