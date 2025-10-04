// OpenAI integration for Foxy AI Coach

interface OpenAIConfig {
  apiKey: string
  assistantId: string
  enabled: boolean
  debug: boolean
}

export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    assistantId: process.env.OPENAI_ASSISTANT_ID || '',
    enabled: process.env.NEXT_PUBLIC_FOXY_ENABLED === 'true',
    debug: process.env.NEXT_PUBLIC_FOXY_DEBUG === 'true'
  }
}

export interface FoxyContext {
  mode: 'tutorial' | 'coach'
  userId: string
  userName: string
  currentPage?: string
  tutorialProgress?: number
  currentStep?: string
  kpis?: {
    monthlyIncome: number
    totalExpenses: number
    readyToAssign: number
    totalDebt: number
    topCategories: Array<{ name: string; spent: number; budget: number; percentage: number }>
    recentTransactions: Array<{ amount: number; category: string; date: string; description: string }>
    upcomingBills: Array<{ name: string; amount: number; dueDate: string; overdue: boolean }>
    savingsRate: number
    budgetUtilization: number
  }
  debts?: Array<{
    name: string
    balance: number
    apr: number
    minPayment: number
    type: 'credit_card' | 'loan' | 'other'
  }>
  goals?: Array<{
    name: string
    target: number
    saved: number
    priority: number
    progress: number
    projectedDate?: string
  }>
}

export interface FoxyToolCall {
  name: string
  args: Record<string, any>
}

export interface FoxyResponse {
  message: string
  toolCalls?: FoxyToolCall[]
  reasoning?: string
}

// Foxy's system prompt with user context injection
export function buildFoxySystemPrompt(context: FoxyContext): string {
  let financialContext = ''
  
  if (context.kpis) {
    financialContext = `
**Current Financial Data:**
- Monthly Income: $${context.kpis.monthlyIncome.toLocaleString()}
- Ready to Assign: $${context.kpis.readyToAssign.toLocaleString()} ${context.kpis.readyToAssign > 0 ? '(needs allocation!)' : '(zero-based ✓)'}
- Total Expenses: $${context.kpis.totalExpenses.toLocaleString()}
- Total Debt: $${context.kpis.totalDebt.toLocaleString()}
- Savings Rate: ${context.kpis.savingsRate}%`

    if (context.kpis.topCategories?.length > 0) {
      const topSpending = context.kpis.topCategories.slice(0, 3).map(cat => 
        `${cat.name}: $${cat.spent}/${cat.budget} (${cat.percentage}% used)`
      ).join(', ')
      financialContext += `
- Top Spending: ${topSpending}`
    }

    if (context.kpis.upcomingBills?.length > 0) {
      const urgentBills = context.kpis.upcomingBills.filter(bill => bill.overdue || new Date(bill.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))
      if (urgentBills.length > 0) {
        financialContext += `
- Urgent Bills: ${urgentBills.map(b => `${b.name} ($${b.amount}) ${b.overdue ? 'OVERDUE' : 'due soon'}`).join(', ')}`
      }
    }
  }

  const basePrompt = `You are **Foxy 🦊**, the friendly, gamified financial coach inside Outwit Budget.

**Current Context:**
- User: ${context.userName}
- Mode: ${context.mode.toUpperCase()}
- Current Page: ${context.currentPage || 'Dashboard'}
- Tutorial Progress: ${context.tutorialProgress || 0}%
${context.currentStep ? `- Current Step: ${context.currentStep}` : ''}${financialContext}

You operate in two modes:

1) **TUTORIAL MODE**
- Goal: teach features fast with short steps and progress feedback.
- Tone: upbeat, concise, motivating; use emojis sparingly (🎉 🚀 🏆).
- Never give financial advice. Educate only.
- For each step: explain in 1–3 sentences, then propose one concrete action.
- Celebrate completions, unlock badges, and update progress via tools.

2) **COACH MODE**
- Goal: turn user's real data into clear, actionable insights. Never prescribe.
- ALWAYS ground statements in their actual numbers: "Your Ready to Assign is $X..." or "Looking at your spending data..."
- Present 2–3 specific options tied to app features they can use right now.
- Use accurate definitions: APR = yearly cost of borrowing; Rollover = unspent budget carried forward; Ready to Assign = unallocated money in zero-based budgeting.
- Respect privacy. Focus on patterns, not specific transactions.
- If asked "What should I do?", summarize their situation with real numbers and present options with trade-offs. No guarantees.

**Page-Specific Guidance:**
${getPageGuidance(context.currentPage || 'dashboard')}

**Available Tools:**
- navigate({ route: string }) - Navigate to app pages
- openModal({ id: string }) - Open specific modals  
- markStepComplete({ stepId: string }) - Mark tutorial step as complete
- getKpis({ range?: string }) - Get user's financial KPIs
- runDebtSim({ method: string, extraPayment: number }) - Run debt simulation
- createGoal({ name: string, amount: number, date?: string, priority: number }) - Create savings goal
- explain({ term: string }) - Get definition for financial terms

**General Rules:**
- If jargon appears, add a brief parenthetical definition.
- Prefer tool usage when helpful.
- Never fabricate notifications. If none exist, say so.
- Keep responses under 120 tokens unless the user asks for more.
- Match the app's current theme; do not output HTML/CSS.

**Safety:**
- Do not provide tax, legal, investment, or individualized financial advice.
- Offer education and options only.
- Always include educational disclaimers.

**Current User Data:**
${context.kpis ? `
Monthly Income: $${context.kpis.monthlyIncome}
Ready to Assign: $${context.kpis.readyToAssign}
Total Expenses: $${context.kpis.totalExpenses}
Top Categories: ${context.kpis.topCategories.map(c => `${c.name} ($${c.amount})`).join(', ')}
` : 'No financial data available yet.'}

${context.debts && context.debts.length > 0 ? `
Debts: ${context.debts.map(d => `${d.name} ($${d.balance} at ${(d.apr * 100).toFixed(1)}% APR)`).join(', ')}
` : ''}

${context.goals && context.goals.length > 0 ? `
Goals: ${context.goals.map(g => `${g.name} ($${g.saved}/$${g.target})`).join(', ')}
` : ''}

Remember: You're an educational companion, not a financial advisor. Focus on helping users understand their options and learn about personal finance concepts.`

  return basePrompt
}

function getPageGuidance(page: string): string {
  switch (page) {
    case 'dashboard':
      return `Focus on overall financial health. Help interpret KPIs. Point out Ready to Assign issues, upcoming bills, or spending alerts.`
    case 'budget':
      return `Explain zero-based budgeting. Help allocate Ready to Assign. Suggest category adjustments based on actual spending patterns.`
    case 'income':
      return `Help set up recurring vs one-off income. Explain how income feeds Ready to Assign. Suggest frequency for irregular income.`
    case 'debts':
      return `Explain Avalanche vs Snowball methods using their actual debt data. Calculate potential savings from extra payments.`
    case 'goals':
      return `Help set SMART goals. Suggest funding from Ready to Assign. Calculate realistic timelines based on their income.`
    case 'bills':
      return `Help organize bills by due dates. Suggest automation. Explain integration with budget categories.`
    case 'transactions':
      return `Help categorize transactions. Explain import/export. Point out spending patterns from their actual data.`
    case 'reports':
      return `Help interpret trends. Explain ratios using their numbers. Suggest improvements based on actual spending patterns.`
    case 'investments':
      return `Explain compound interest basics. Help set up systematic plans. Discuss how investments fit their overall plan.`
    default:
      return `Provide general financial guidance based on their current situation and data.`
  }
}

// Call OpenAI Assistant API
export async function callFoxyAI(message: string, context: FoxyContext): Promise<FoxyResponse> {
  const config = getOpenAIConfig()
  
  if (!config.enabled || !config.apiKey) {
    // Return a helpful fallback response
    return generateFallbackResponse(message, context)
  }

  try {
    // Use OpenAI Chat Completions API (simpler than Assistants API for now)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: buildFoxySystemPrompt(context)
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`)
    }

    const responseContent = data.choices[0]?.message?.content || "I'm having trouble responding right now. Please try again! 🦊"

    // Parse tool calls if any
    const toolCalls = parseToolCalls(responseContent)

    if (config.debug) {
      console.log('Foxy AI Response:', {
        message: responseContent,
        toolCalls,
        usage: data.usage
      })
    }

    return {
      message: responseContent,
      toolCalls
    }

  } catch (error) {
    console.error('Foxy AI Error:', error)
    
    // Fallback to context-aware response
    return generateFallbackResponse(message, context)
  }
}

// Generate intelligent fallback responses when AI is unavailable
function generateFallbackResponse(message: string, context: FoxyContext): FoxyResponse {
  const lowerMessage = message.toLowerCase()
  
  // Tutorial mode responses
  if (context.mode === 'tutorial') {
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return {
        message: "I'm here to help! 🦊 Let me guide you through this step by step. Ready to continue with the tutorial?",
        toolCalls: []
      }
    }
    
    if (lowerMessage.includes('skip') || lowerMessage.includes('next')) {
      return {
        message: "No problem! Let's move to the next step. You're doing great! 🚀",
        toolCalls: context.currentStep ? [{ name: 'markStepComplete', args: { stepId: context.currentStep } }] : []
      }
    }
    
    return {
      message: "Great question! 🦊 I'm here to help you learn Outwit Budget. What would you like to know about this step?",
      toolCalls: []
    }
  }
  
  // Coach mode responses
  if (lowerMessage.includes('budget') || lowerMessage.includes('money')) {
    return {
      message: `Based on your data, you have $${context.kpis?.readyToAssign || 0} Ready to Assign! 💰 You could assign it to categories or save for goals. Want to check your budget?`,
      toolCalls: [{ name: 'navigate', args: { route: '/budget' } }]
    }
  }
  
  if (lowerMessage.includes('debt') || lowerMessage.includes('payoff')) {
    return {
      message: "Looking at debt payoff strategies? The Debt Simulator can help you compare Snowball vs Avalanche methods! 📊",
      toolCalls: [{ name: 'navigate', args: { route: '/debts' } }]
    }
  }
  
  if (lowerMessage.includes('goal') || lowerMessage.includes('save')) {
    return {
      message: "Goals are powerful motivators! 🎯 Setting clear targets helps you stay focused. Want to create or review your goals?",
      toolCalls: [{ name: 'navigate', args: { route: '/goals' } }]
    }
  }
  
  // Default response
  return {
    message: "Hi there! 🦊 I'm Foxy, your financial coach. I can help you understand your budget, track goals, and learn about personal finance. What would you like to explore?",
    toolCalls: []
  }
}

// Parse tool calls from assistant response (simplified)
function parseToolCalls(content: string): FoxyToolCall[] {
  const toolCalls: FoxyToolCall[] = []
  
  // Look for TOOL: patterns in the response
  const toolPattern = /TOOL:\s*({[^}]+})/g
  let match

  while ((match = toolPattern.exec(content)) !== null) {
    try {
      const toolCall = JSON.parse(match[1])
      if (toolCall.name && toolCall.args) {
        toolCalls.push(toolCall)
      }
    } catch (error) {
      console.error('Failed to parse tool call:', match[1])
    }
  }

  return toolCalls
}

// Validate OpenAI configuration
export function validateOpenAIConfig(): { valid: boolean; error?: string } {
  const config = getOpenAIConfig()
  
  if (!config.enabled) {
    return { valid: false, error: 'Foxy AI is disabled' }
  }
  
  if (!config.apiKey) {
    return { valid: false, error: 'OpenAI API key not configured' }
  }
  
  if (!config.assistantId) {
    return { valid: false, error: 'OpenAI Assistant ID not configured' }
  }
  
  return { valid: true }
}
