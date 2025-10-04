import { ZodError } from 'zod'

export function formatZodError(error: ZodError): string {
  return error.issues?.map(e => e.message).join(', ') || 'Validation error'
}

export function createErrorResponse(error: ZodError) {
  return { 
    success: false, 
    error: formatZodError(error) 
  }
}
