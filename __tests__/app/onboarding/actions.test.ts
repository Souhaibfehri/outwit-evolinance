import { estimateNextPayDate, distributeByHeuristic } from '@/app/(app)/onboarding/actions'

describe('Onboarding Actions', () => {
  describe('estimateNextPayDate', () => {
    const baseDate = new Date('2024-01-15')

    it('should calculate weekly next pay date', () => {
      const result = estimateNextPayDate('weekly', baseDate)
      expect(result.getDate()).toBe(22) // 7 days later
    })

    it('should calculate biweekly next pay date', () => {
      const result = estimateNextPayDate('biweekly', baseDate)
      expect(result.getDate()).toBe(29) // 14 days later
    })

    it('should calculate monthly next pay date', () => {
      const result = estimateNextPayDate('monthly', baseDate)
      expect(result.getMonth()).toBe(1) // February (next month)
      expect(result.getDate()).toBe(15) // Same day
    })

    it('should calculate quarterly next pay date', () => {
      const result = estimateNextPayDate('quarterly', baseDate)
      expect(result.getMonth()).toBe(3) // April (3 months later)
    })

    it('should calculate annual next pay date', () => {
      const result = estimateNextPayDate('annual', baseDate)
      expect(result.getFullYear()).toBe(2025) // Next year
    })

    it('should handle custom frequency with monthly fallback', () => {
      const result = estimateNextPayDate('custom', baseDate)
      expect(result.getMonth()).toBe(1) // February (fallback to monthly)
    })
  })

  describe('distributeByHeuristic', () => {
    const categories = ['essentials', 'food', 'transport', 'lifestyle', 'savings']

    it('should distribute amount across categories', () => {
      const result = distributeByHeuristic(1000, categories)
      
      expect(result).toHaveLength(categories.length)
      expect(result.every(item => item.amount >= 0)).toBe(true)
      
      const totalDistributed = result.reduce((sum, item) => sum + item.amount, 0)
      expect(totalDistributed).toBeCloseTo(1000, 0)
    })

    it('should prioritize essentials category', () => {
      const result = distributeByHeuristic(1000, categories)
      
      const essentialsItem = result.find(item => item.categoryId === 'essentials')
      const foodItem = result.find(item => item.categoryId === 'food')
      
      expect(essentialsItem?.amount).toBeGreaterThan(foodItem?.amount || 0)
    })

    it('should handle single category', () => {
      const result = distributeByHeuristic(500, ['essentials'])
      
      expect(result).toHaveLength(1)
      expect(result[0].amount).toBe(500)
      expect(result[0].categoryId).toBe('essentials')
    })

    it('should handle zero amount', () => {
      const result = distributeByHeuristic(0, categories)
      
      expect(result).toHaveLength(categories.length)
      expect(result.every(item => item.amount === 0)).toBe(true)
    })

    it('should distribute remaining amount when heuristics don\'t cover all', () => {
      const unknownCategories = ['unknown1', 'unknown2', 'unknown3']
      const result = distributeByHeuristic(300, unknownCategories)
      
      expect(result).toHaveLength(unknownCategories.length)
      
      const totalDistributed = result.reduce((sum, item) => sum + item.amount, 0)
      expect(totalDistributed).toBeCloseTo(300, 0)
    })
  })
})
