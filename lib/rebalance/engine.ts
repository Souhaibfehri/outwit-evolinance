// Adaptive Rebalance Engine for Overspending
// AI-free, rule-based fixes with instant simulation

export interface OverspentCategory {
  categoryId: string
  categoryName: string
  groupId: string
  groupName: string
  assigned: number
  spent: number
  overspent: number // negative available amount
  priority: number
}

export interface DonorCategory {
  categoryId: string
  categoryName: string
  groupId: string
  groupName: string
  assigned: number
  spent: number
  available: number // positive available amount
  flexibility: number // how safe it is to move funds from this category
  hasBillsDueSoon: boolean
  lastSpendDate?: string
}

export interface RebalanceMove {
  fromCategoryId: string
  fromCategoryName: string
  toCategoryId: string
  toCategoryName: string
  amount: number
  reason: string
  impact: 'low' | 'medium' | 'high'
  futureImpact?: FutureImpact
}

export interface FutureImpact {
  nextMonthEffect: number
  threeMonthEffect: number
  confidence: 'high' | 'medium' | 'low'
  sparklineData: number[] // 12 months of projected impact
}

export interface RebalanceResult {
  overspentCategories: OverspentCategory[]
  donorCategories: DonorCategory[]
  suggestedMoves: RebalanceMove[]
  totalCovered: number
  totalUncovered: number
  canFullyCover: boolean
  alternativeOptions: AlternativeOption[]
}

export interface AlternativeOption {
  type: 'next_month_reduction' | 'emergency_fund' | 'credit_buffer'
  description: string
  amount: number
  pros: string[]
  cons: string[]
}

export interface ReassignmentRecord {
  id: string
  userId: string
  month: string
  timestamp: string
  moves: RebalanceMove[]
  totalAmount: number
  reason: string
  isReversible: boolean
  reversedAt?: string
  reversedBy?: string
}

/**
 * Analyze overspending and suggest rebalancing moves
 */
export function analyzeOverspending(
  categories: any[],
  budgetItems: any[],
  transactions: any[],
  bills: any[],
  month: string,
  forecastData?: any[]
): RebalanceResult {
  // Identify overspent categories
  const overspentCategories = findOverspentCategories(categories, budgetItems, month)
  
  if (overspentCategories.length === 0) {
    return {
      overspentCategories: [],
      donorCategories: [],
      suggestedMoves: [],
      totalCovered: 0,
      totalUncovered: 0,
      canFullyCover: true,
      alternativeOptions: []
    }
  }

  // Find potential donor categories
  const donorCategories = findDonorCategories(
    categories, 
    budgetItems, 
    transactions, 
    bills, 
    month
  )

  // Generate rebalancing moves
  const suggestedMoves = generateRebalanceMoves(
    overspentCategories,
    donorCategories,
    forecastData
  )

  const totalOverspent = overspentCategories.reduce((sum, cat) => sum + cat.overspent, 0)
  const totalCovered = suggestedMoves.reduce((sum, move) => sum + move.amount, 0)
  const totalUncovered = Math.max(0, totalOverspent - totalCovered)

  // Generate alternative options if can't fully cover
  const alternativeOptions = totalUncovered > 0 ? 
    generateAlternativeOptions(totalUncovered, overspentCategories) : []

  return {
    overspentCategories,
    donorCategories,
    suggestedMoves,
    totalCovered,
    totalUncovered,
    canFullyCover: totalUncovered === 0,
    alternativeOptions
  }
}

/**
 * Find categories that are overspent (negative available)
 */
function findOverspentCategories(
  categories: any[],
  budgetItems: any[],
  month: string
): OverspentCategory[] {
  const overspent: OverspentCategory[] = []

  for (const category of categories) {
    const budgetItem = budgetItems.find(
      (bi: any) => bi.categoryId === category.id && bi.month === month
    )

    if (!budgetItem) continue

    const assigned = parseFloat(budgetItem.assigned) || 0
    const spent = parseFloat(budgetItem.spent) || 0
    const available = assigned - spent

    if (available < 0) {
      overspent.push({
        categoryId: category.id,
        categoryName: category.name,
        groupId: category.groupId || 'uncategorized',
        groupName: category.groupName || 'Uncategorized',
        assigned,
        spent,
        overspent: Math.abs(available),
        priority: category.priority || 3
      })
    }
  }

  // Sort by overspent amount (highest first)
  return overspent.sort((a, b) => b.overspent - a.overspent)
}

/**
 * Find categories with available funds that can be donors
 */
function findDonorCategories(
  categories: any[],
  budgetItems: any[],
  transactions: any[],
  bills: any[],
  month: string
): DonorCategory[] {
  const donors: DonorCategory[] = []
  const currentDate = new Date()
  const sevenDaysFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)

  for (const category of categories) {
    const budgetItem = budgetItems.find(
      (bi: any) => bi.categoryId === category.id && bi.month === month
    )

    if (!budgetItem) continue

    const assigned = parseFloat(budgetItem.assigned) || 0
    const spent = parseFloat(budgetItem.spent) || 0
    const available = assigned - spent

    // Only consider categories with positive available funds
    if (available <= 0) continue

    // Check if category has bills due within 7 days
    const hasBillsDueSoon = bills.some((bill: any) => 
      bill.categoryId === category.id &&
      new Date(bill.dueDate) <= sevenDaysFromNow &&
      !bill.isPaid
    )

    // Skip categories with bills due soon (they need their funds)
    if (hasBillsDueSoon) continue

    // Calculate flexibility score
    const flexibility = calculateFlexibility(
      category,
      budgetItem,
      transactions,
      month
    )

    // Find last spend date
    const categoryTransactions = transactions.filter((txn: any) =>
      txn.categoryId === category.id &&
      txn.budgetMonth === month &&
      txn.type === 'outflow'
    )
    const lastSpendDate = categoryTransactions.length > 0 ?
      categoryTransactions.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0].date : undefined

    donors.push({
      categoryId: category.id,
      categoryName: category.name,
      groupId: category.groupId || 'uncategorized',
      groupName: category.groupName || 'Uncategorized',
      assigned,
      spent,
      available,
      flexibility,
      hasBillsDueSoon,
      lastSpendDate
    })
  }

  // Sort by flexibility (most flexible first) and available amount
  return donors
    .sort((a, b) => {
      if (a.flexibility !== b.flexibility) {
        return b.flexibility - a.flexibility
      }
      return b.available - a.available
    })
    .slice(0, 5) // Top 5 donor categories
}

/**
 * Calculate how flexible a category is for moving funds
 */
function calculateFlexibility(
  category: any,
  budgetItem: any,
  transactions: any[],
  month: string
): number {
  let flexibility = 50 // Base score

  // Category type adjustments
  const categoryName = category.name.toLowerCase()
  if (categoryName.includes('emergency') || categoryName.includes('savings')) {
    flexibility += 30 // Savings categories are more flexible
  }
  if (categoryName.includes('entertainment') || categoryName.includes('dining')) {
    flexibility += 20 // Discretionary spending is flexible
  }
  if (categoryName.includes('rent') || categoryName.includes('mortgage') || 
      categoryName.includes('insurance') || categoryName.includes('utilities')) {
    flexibility -= 40 // Essential categories are less flexible
  }

  // Spending pattern adjustments
  const categoryTransactions = transactions.filter((txn: any) =>
    txn.categoryId === category.id &&
    txn.budgetMonth === month &&
    txn.type === 'outflow'
  )

  const spentPercentage = budgetItem.assigned > 0 ? 
    (budgetItem.spent / budgetItem.assigned) * 100 : 0

  if (spentPercentage < 25) {
    flexibility += 20 // Low utilization = more flexible
  } else if (spentPercentage > 75) {
    flexibility -= 20 // High utilization = less flexible
  }

  // Recent activity adjustments
  const recentTransactions = categoryTransactions.filter((txn: any) => {
    const txnDate = new Date(txn.date)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return txnDate >= sevenDaysAgo
  })

  if (recentTransactions.length === 0) {
    flexibility += 15 // No recent activity = more flexible
  }

  // Target type adjustments
  if (category.targetType === 'set_aside_another') {
    flexibility -= 10 // Regular savings targets are less flexible
  }
  if (category.targetType === 'have_balance_by' && category.targetDate) {
    const daysUntilTarget = Math.ceil(
      (new Date(category.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilTarget <= 30) {
      flexibility -= 25 // Urgent targets are less flexible
    }
  }

  return Math.max(0, Math.min(100, flexibility))
}

/**
 * Generate optimal rebalancing moves
 */
function generateRebalanceMoves(
  overspentCategories: OverspentCategory[],
  donorCategories: DonorCategory[],
  forecastData?: any[]
): RebalanceMove[] {
  const moves: RebalanceMove[] = []
  const availableDonors = [...donorCategories]

  for (const overspent of overspentCategories) {
    let remainingNeed = overspent.overspent

    while (remainingNeed > 0 && availableDonors.length > 0) {
      // Find best donor for this overspent category
      const bestDonor = findBestDonor(availableDonors, overspent, remainingNeed)
      
      if (!bestDonor) break

      const moveAmount = Math.min(remainingNeed, bestDonor.available)
      
      moves.push({
        fromCategoryId: bestDonor.categoryId,
        fromCategoryName: bestDonor.categoryName,
        toCategoryId: overspent.categoryId,
        toCategoryName: overspent.categoryName,
        amount: moveAmount,
        reason: generateMoveReason(bestDonor, overspent, moveAmount),
        impact: calculateMoveImpact(bestDonor, moveAmount),
        futureImpact: forecastData ? 
          calculateFutureImpact(bestDonor, moveAmount, forecastData) : undefined
      })

      // Update donor availability
      bestDonor.available -= moveAmount
      remainingNeed -= moveAmount

      // Remove donor if no funds left
      if (bestDonor.available <= 0) {
        const donorIndex = availableDonors.findIndex(d => d.categoryId === bestDonor.categoryId)
        if (donorIndex >= 0) {
          availableDonors.splice(donorIndex, 1)
        }
      }
    }
  }

  return moves
}

/**
 * Find the best donor category for a specific overspent category
 */
function findBestDonor(
  donors: DonorCategory[],
  overspent: OverspentCategory,
  neededAmount: number
): DonorCategory | null {
  if (donors.length === 0) return null

  // Score each donor
  const scoredDonors = donors.map(donor => ({
    donor,
    score: calculateDonorScore(donor, overspent, neededAmount)
  }))

  // Return highest scoring donor
  scoredDonors.sort((a, b) => b.score - a.score)
  return scoredDonors[0].donor
}

/**
 * Calculate donor score for prioritization
 */
function calculateDonorScore(
  donor: DonorCategory,
  overspent: OverspentCategory,
  neededAmount: number
): number {
  let score = donor.flexibility

  // Prefer donors with more available funds
  score += Math.min(20, (donor.available / neededAmount) * 10)

  // Prefer donors from different groups (spread the impact)
  if (donor.groupId !== overspent.groupId) {
    score += 15
  }

  // Prefer donors that haven't been used recently
  if (!donor.lastSpendDate) {
    score += 10
  } else {
    const daysSinceLastSpend = Math.ceil(
      (Date.now() - new Date(donor.lastSpendDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastSpend > 7) {
      score += 5
    }
  }

  return score
}

/**
 * Generate human-readable reason for the move
 */
function generateMoveReason(
  donor: DonorCategory,
  overspent: OverspentCategory,
  amount: number
): string {
  const reasons = []

  if (donor.flexibility > 70) {
    reasons.push('high flexibility')
  }
  if (donor.available > amount * 2) {
    reasons.push('ample funds available')
  }
  if (!donor.lastSpendDate) {
    reasons.push('no recent activity')
  }
  if (donor.groupId !== overspent.groupId) {
    reasons.push('different category group')
  }

  const reasonText = reasons.length > 0 ? reasons.join(', ') : 'available funds'
  return `Move from ${donor.categoryName} (${reasonText})`
}

/**
 * Calculate the impact level of moving funds
 */
function calculateMoveImpact(donor: DonorCategory, amount: number): 'low' | 'medium' | 'high' {
  const percentageOfAvailable = (amount / donor.available) * 100

  if (percentageOfAvailable <= 25) return 'low'
  if (percentageOfAvailable <= 50) return 'medium'
  return 'high'
}

/**
 * Calculate future impact using forecast data
 */
function calculateFutureImpact(
  donor: DonorCategory,
  amount: number,
  forecastData: any[]
): FutureImpact {
  // Find donor category in forecast data
  const donorForecast = forecastData.find(month => 
    month.categories.some((cat: any) => cat.categoryId === donor.categoryId)
  )

  if (!donorForecast) {
    return {
      nextMonthEffect: 0,
      threeMonthEffect: 0,
      confidence: 'low',
      sparklineData: Array(12).fill(0)
    }
  }

  // Simple impact calculation - reduction in available funds
  const nextMonthEffect = -amount
  const threeMonthEffect = -amount * 0.5 // Assume partial recovery over time

  // Generate sparkline data (12 months)
  const sparklineData = Array(12).fill(0).map((_, index) => {
    if (index === 0) return -amount
    if (index <= 3) return -amount * (1 - index * 0.25)
    return 0
  })

  return {
    nextMonthEffect,
    threeMonthEffect,
    confidence: 'medium',
    sparklineData
  }
}

/**
 * Generate alternative options when full coverage isn't possible
 */
function generateAlternativeOptions(
  uncoveredAmount: number,
  overspentCategories: OverspentCategory[]
): AlternativeOption[] {
  const options: AlternativeOption[] = []

  // Next month reduction option
  options.push({
    type: 'next_month_reduction',
    description: `Reduce next month's budget by ${formatCurrency(uncoveredAmount)}`,
    amount: uncoveredAmount,
    pros: [
      'Prevents recurring overspending',
      'Forces better spending discipline',
      'No immediate impact on other categories'
    ],
    cons: [
      'Less flexibility next month',
      'May be difficult to stick to reduced budget',
      'Could lead to more overspending if unrealistic'
    ]
  })

  // Emergency fund option (if uncovered amount is significant)
  if (uncoveredAmount > 100) {
    options.push({
      type: 'emergency_fund',
      description: `Use emergency fund to cover ${formatCurrency(uncoveredAmount)}`,
      amount: uncoveredAmount,
      pros: [
        'Immediate resolution',
        'Maintains current spending patterns',
        'No impact on other budget categories'
      ],
      cons: [
        'Reduces emergency fund balance',
        'Should be replenished quickly',
        'Not sustainable for recurring overspending'
      ]
    })
  }

  return options
}

/**
 * Apply rebalancing moves and create reassignment records
 */
export function applyRebalanceMoves(
  moves: RebalanceMove[],
  budgetItems: any[],
  month: string,
  userId: string,
  reason: string = 'Cover overspending'
): {
  updatedBudgetItems: any[]
  reassignmentRecord: ReassignmentRecord
} {
  const updatedBudgetItems = [...budgetItems]
  
  // Apply each move
  for (const move of moves) {
    // Reduce from donor category
    const fromItemIndex = updatedBudgetItems.findIndex(
      item => item.categoryId === move.fromCategoryId && item.month === month
    )
    if (fromItemIndex >= 0) {
      updatedBudgetItems[fromItemIndex] = {
        ...updatedBudgetItems[fromItemIndex],
        assigned: (updatedBudgetItems[fromItemIndex].assigned || 0) - move.amount,
        updatedAt: new Date().toISOString()
      }
    }

    // Add to overspent category
    const toItemIndex = updatedBudgetItems.findIndex(
      item => item.categoryId === move.toCategoryId && item.month === month
    )
    if (toItemIndex >= 0) {
      updatedBudgetItems[toItemIndex] = {
        ...updatedBudgetItems[toItemIndex],
        assigned: (updatedBudgetItems[toItemIndex].assigned || 0) + move.amount,
        updatedAt: new Date().toISOString()
      }
    }
  }

  // Create reassignment record
  const reassignmentRecord: ReassignmentRecord = {
    id: `reassignment_${Date.now()}`,
    userId,
    month,
    timestamp: new Date().toISOString(),
    moves,
    totalAmount: moves.reduce((sum, move) => sum + move.amount, 0),
    reason,
    isReversible: true
  }

  return {
    updatedBudgetItems,
    reassignmentRecord
  }
}

/**
 * Reverse a reassignment (undo)
 */
export function reverseReassignment(
  reassignmentRecord: ReassignmentRecord,
  budgetItems: any[],
  userId: string
): {
  updatedBudgetItems: any[]
  reversalRecord: ReassignmentRecord
} {
  const updatedBudgetItems = [...budgetItems]
  
  // Reverse each move
  for (const move of reassignmentRecord.moves) {
    // Add back to original donor category
    const fromItemIndex = updatedBudgetItems.findIndex(
      item => item.categoryId === move.fromCategoryId && item.month === reassignmentRecord.month
    )
    if (fromItemIndex >= 0) {
      updatedBudgetItems[fromItemIndex] = {
        ...updatedBudgetItems[fromItemIndex],
        assigned: (updatedBudgetItems[fromItemIndex].assigned || 0) + move.amount,
        updatedAt: new Date().toISOString()
      }
    }

    // Remove from recipient category
    const toItemIndex = updatedBudgetItems.findIndex(
      item => item.categoryId === move.toCategoryId && item.month === reassignmentRecord.month
    )
    if (toItemIndex >= 0) {
      updatedBudgetItems[toItemIndex] = {
        ...updatedBudgetItems[toItemIndex],
        assigned: (updatedBudgetItems[toItemIndex].assigned || 0) - move.amount,
        updatedAt: new Date().toISOString()
      }
    }
  }

  // Create reversal record
  const reversalRecord: ReassignmentRecord = {
    id: `reversal_${Date.now()}`,
    userId,
    month: reassignmentRecord.month,
    timestamp: new Date().toISOString(),
    moves: reassignmentRecord.moves.map(move => ({
      ...move,
      fromCategoryId: move.toCategoryId,
      fromCategoryName: move.toCategoryName,
      toCategoryId: move.fromCategoryId,
      toCategoryName: move.fromCategoryName,
      reason: `Reverse: ${move.reason}`
    })),
    totalAmount: reassignmentRecord.totalAmount,
    reason: `Reverse reassignment: ${reassignmentRecord.reason}`,
    isReversible: false
  }

  return {
    updatedBudgetItems,
    reversalRecord
  }
}

// Helper function for currency formatting
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
