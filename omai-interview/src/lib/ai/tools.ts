import type { Specialty, InterviewMode } from '../../types/interview'
import { getQuestion } from './questionBank'

// JSON Schema format required by OpenAI function calling API
export const INTERVIEW_TOOLS = [
  {
    type: 'function' as const,
    name: 'get_question',
    description: 'Retrieve the next interview question for the current residency specialty and interview mode. Call this whenever you need a new question to ask the candidate.',
    parameters: {
      type: 'object' as const,
      properties: {
        specialty: {
          type: 'string',
          enum: [
            'internal-medicine',
            'general-surgery',
            'psychiatry',
            'pediatrics',
            'emergency-medicine',
            'family-medicine',
          ],
          description: 'The residency specialty for this interview',
        },
        mode: {
          type: 'string',
          enum: ['behavioral', 'clinical'],
          description: 'The interview mode — behavioral for MMI/competency questions, clinical for patient scenarios',
        },
        questionIndex: {
          type: 'number',
          description: 'Zero-based index of the question to retrieve. Increment by 1 after each question asked.',
        },
      },
      required: ['specialty', 'mode', 'questionIndex'],
    },
  },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handleToolCall(name: string, args: Record<string, any>): any {
  if (name === 'get_question') {
    const { specialty, mode, questionIndex } = args as {
      specialty: Specialty
      mode: Exclude<InterviewMode, 'mixed'>
      questionIndex: number
    }
    const question = getQuestion(specialty, mode, questionIndex)
    return question ?? null
  }
  return null
}
