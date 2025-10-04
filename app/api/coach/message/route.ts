import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { callFoxyAI, type FoxyContext } from '@/lib/foxy/openai'

const MessageSchema = z.object({
  message: z.string().min(1).max(1000),
  mode: z.enum(['tutorial', 'coach']),
  context: z.object({
    tutorialProgress: z.number().optional(),
    currentStep: z.string().optional(),
    kpis: z.any().optional()
  }).optional()
})

// System prompt for Foxy AI Coach
const FOXY_SYSTEM_PROMPT = `You are **Foxy 🦊**, the friendly, gamified financial coach inside Outwit Budget.
You operate in two modes:

1) TUTORIAL MODE
- Goal: teach features fast with short steps and progress feedback.
- Tone: upbeat, concise, motivating; use emojis sparingly (🎉 🚀 🏆).
- Never give financial advice. Educate only.
- For each step: explain in 1–3 sentences, then propose one concrete action.
- Celebrate completions, unlock badges, and update progress via tools.

2) COACH MODE
- Goal: turn data into clear, optional insights. Never prescribe.
- Always ground statements: start with "Based on your data…" or "Looking at your numbers…".
- Present 2–3 options tied to app features. Example: "You could try the Avalanche method in the Debt Simulator to see interest savings."
- Use accurate definitions: APR = yearly cost of borrowing; Rollover = unspent budget carried forward; etc.
- Respect privacy. Do not expose sensitive info. Do not ask for full card numbers or addresses.
- If asked "What should I do?", summarize the situation and present options with trade-offs. No guarantees.

General Rules
- If jargon appears, add a brief parenthetical definition.
- Prefer tool usage: navigate, openModal, markStepComplete, runDebtSim, createGoal.
- Never fabricate notifications. If none exist, say so.
- Match the app's current theme; do not output HTML/CSS.
- Keep responses under 120 tokens unless the user asks for more.

Safety:
- Do not provide tax, legal, investment, or individualized financial advice.
- Offer education and options only.

Available tools:
- navigate({ route: string }) - Navigate to app pages
- openModal({ id: string }) - Open specific modals
- markStepComplete({ stepId: string }) - Mark tutorial step as complete
- getKpis({ range?: string }) - Get user's financial KPIs
- runDebtSim({ method: string, extraPayment: number }) - Run debt simulation
- createGoal({ name: string, amount: number, date?: string, priority: number }) - Create savings goal
- explain(term: string) - Get definition for financial terms`

// POST /api/coach/message - Send message to Foxy AI
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, mode, context } = MessageSchema.parse(body)

    // Prepare context for AI
    const aiContext: FoxyContext = {
      mode,
      userId: user.id,
      userName: user.user_metadata?.name || 'there',
      tutorialProgress: context?.tutorialProgress,
      currentStep: context?.currentStep,
      kpis: context?.kpis || {
        monthlyIncome: 0,
        totalExpenses: 0,
        readyToAssign: 0,
        topCategories: []
      }
    }

    // Call real OpenAI API
    const aiResponse = await callFoxyAI(message, aiContext)

    // Save message to user metadata (in production, use proper database)
    const messages = user.user_metadata?.coach_messages || []
    const newMessages = [
      ...messages.slice(-10), // Keep last 10 messages
      {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: aiResponse.message,
        timestamp: new Date().toISOString(),
        toolCalls: aiResponse.toolCalls
      }
    ]

    await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        coach_messages: newMessages
      }
    })

    return NextResponse.json(aiResponse)
  } catch (error) {
    console.error('Error processing coach message:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid message data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

// Mock Foxy responses (replace with OpenAI in production)
function generateMockFoxyResponse(message: string, mode: string, context: any) {
  const responses = {
    tutorial: [
      {
        message: "Great question! 🦊 Let me walk you through this step by step. Ready to explore the Budget page?",
        toolCalls: [{ name: 'navigate', args: { route: '/budget' } }]
      },
      {
        message: "Perfect! You're getting the hang of zero-based budgeting. Every dollar needs a job! 💼",
        toolCalls: []
      },
      {
        message: "Nice work! 🎉 You've completed this step. Ready for the next challenge?",
        toolCalls: [{ name: 'markStepComplete', args: { stepId: context.currentStep } }]
      }
    ],
    coach: [
      {
        message: "Based on your data, you have $240 Ready to Assign! 💰 You could assign it to categories or save for goals. What sounds good?",
        toolCalls: []
      },
      {
        message: "Looking at your spending, your top category is Groceries. You might want to check if you're on track this month! 🛒",
        toolCalls: [{ name: 'navigate', args: { route: '/budget' } }]
      },
      {
        message: "I noticed you haven't set any goals yet. Emergency funds are a great starting point! Want to create one? 🎯",
        toolCalls: [{ name: 'openModal', args: { id: 'add-goal' } }]
      }
    ]
  }

  const modeResponses = responses[mode as keyof typeof responses]
  const randomResponse = modeResponses[Math.floor(Math.random() * modeResponses.length)]

  return randomResponse
}
