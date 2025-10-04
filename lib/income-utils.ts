// Helper function to calculate next payment dates
export function calculateNextPaymentDate(frequency: string, currentDate: Date): Date {
  const next = new Date(currentDate)
  
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'semimonthly':
      // 15th and last day of month
      if (next.getDate() <= 15) {
        next.setDate(15)
      } else {
        next.setMonth(next.getMonth() + 1)
        next.setDate(0) // Last day of month
      }
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
  }
  
  return next
}

// Helper function to calculate total monthly income
export function calculateMonthlyIncome(recurringIncome: any[], oneOffIncome: any[]): number {
  let monthlyTotal = 0
  
  // Calculate recurring income monthly equivalent
  recurringIncome.forEach((income: any) => {
    if (!income.active) return
    
    const amount = income.amountCents || 0
    switch (income.frequency) {
      case 'weekly':
        monthlyTotal += amount * 4.33 // Average weeks per month
        break
      case 'biweekly':
        monthlyTotal += amount * 2.17 // Average bi-weeks per month
        break
      case 'semimonthly':
        monthlyTotal += amount * 2
        break
      case 'monthly':
        monthlyTotal += amount
        break
    }
  })
  
  // Add one-off income for current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  oneOffIncome.forEach((income: any) => {
    const incomeDate = new Date(income.date)
    if (incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear) {
      monthlyTotal += income.amountCents || 0
    }
  })
  
  return monthlyTotal
}
