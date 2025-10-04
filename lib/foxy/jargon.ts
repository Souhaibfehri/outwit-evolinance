// Jargon definitions for consistent explanations across the app

export interface JargonDefinition {
  term: string
  definition: string
  example?: string
  learnMoreUrl?: string
}

export const JARGON_LIBRARY: Record<string, JargonDefinition> = {
  rollover: {
    term: 'Rollover',
    definition: 'Unspent money in a category that carries over to next month. When disabled, unspent money returns to Ready to Assign.',
    example: 'If you budget $200 for groceries but only spend $150, the remaining $50 rolls over to next month\'s grocery budget.',
    learnMoreUrl: 'https://docs.youneedabudget.com/article/121-ready-to-assign'
  },

  apr: {
    term: 'APR',
    definition: 'Annual Percentage Rate - the yearly cost of borrowing money, expressed as a percentage.',
    example: 'A credit card with 18.99% APR costs you about $19 per year for every $100 you carry as a balance.',
    learnMoreUrl: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-purchase-apr-and-a-cash-advance-apr-en-44/'
  },

  snowball: {
    term: 'Debt Snowball',
    definition: 'Pay minimums on all debts, then put extra money toward the smallest balance first. Provides psychological wins and momentum.',
    example: 'Pay off a $500 credit card before tackling a $15,000 student loan, even if the student loan has higher interest.',
    learnMoreUrl: 'https://www.ramseysolutions.com/debt/how-the-debt-snowball-method-works'
  },

  avalanche: {
    term: 'Debt Avalanche',
    definition: 'Pay minimums on all debts, then put extra money toward the highest interest rate debt first. Saves the most money on interest.',
    example: 'Pay extra on a 24% credit card before a 6% car loan, regardless of balance size.',
    learnMoreUrl: 'https://www.nerdwallet.com/article/finance/what-is-a-debt-avalanche'
  },

  ready_to_assign: {
    term: 'Ready to Assign',
    definition: 'Money you\'ve received but haven\'t assigned to any budget category yet. In zero-based budgeting, this should be $0.',
    example: 'After getting paid $3,000, you assign $1,200 to rent, $400 to groceries, etc. until Ready to Assign reaches $0.',
    learnMoreUrl: 'https://docs.youneedabudget.com/article/121-ready-to-assign'
  },

  zero_based_budgeting: {
    term: 'Zero-Based Budgeting',
    definition: 'A budgeting method where you assign every dollar of income to a specific category or purpose before spending.',
    example: 'Instead of just tracking what you spend, you decide ahead of time where every dollar will go.',
    learnMoreUrl: 'https://www.youneedabudget.com/the-four-rules/'
  },

  recurring_vs_annual: {
    term: 'Recurring vs Annual',
    definition: 'Recurring expenses happen monthly (rent, utilities). Annual expenses happen once per year (insurance, taxes).',
    example: 'Car insurance might be $600/year, so you\'d save $50/month in an "Insurance" category to be ready.',
  },

  emergency_fund: {
    term: 'Emergency Fund',
    definition: 'Savings set aside for unexpected expenses like job loss, medical bills, or major repairs.',
    example: 'Most experts recommend 3-6 months of essential expenses. If you spend $2,000/month on necessities, aim for $6,000-$12,000.',
    learnMoreUrl: 'https://www.nerdwallet.com/article/banking/emergency-fund'
  },

  compound_interest: {
    term: 'Compound Interest',
    definition: 'Earning interest on both your original investment and previously earned interest. The foundation of long-term wealth building.',
    example: '$1,000 at 8% annual return becomes $1,080 after year 1, then $1,166.40 after year 2 (earning interest on the $80 gain too).',
  },

  net_worth: {
    term: 'Net Worth',
    definition: 'Your total assets (what you own) minus your total liabilities (what you owe).',
    example: 'If you have $10,000 in savings and investments but owe $5,000 in debt, your net worth is $5,000.',
  },

  cash_flow: {
    term: 'Cash Flow',
    definition: 'The difference between money coming in (income) and money going out (expenses) over a period.',
    example: 'If you earn $4,000/month and spend $3,500/month, you have positive cash flow of $500/month.',
  }
}

export function getJargonDefinition(term: string): JargonDefinition | null {
  return JARGON_LIBRARY[term.toLowerCase().replace(/\s+/g, '_')] || null
}

export function getAllJargonTerms(): string[] {
  return Object.keys(JARGON_LIBRARY)
}
