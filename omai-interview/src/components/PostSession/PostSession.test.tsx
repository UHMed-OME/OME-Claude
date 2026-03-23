import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PostSession } from './PostSession'
import type { TranscriptTurn, SessionConfig } from '../../types/interview'

const turns: TranscriptTurn[] = [
  { speaker: 'interviewer', text: 'Tell me about yourself.', timestamp: 1000 },
  { speaker: 'student', text: 'I am passionate about medicine.', timestamp: 2000 },
]

const config: SessionConfig = { specialty: 'internal-medicine', mode: 'behavioral' }

describe('PostSession', () => {
  it('renders all transcript turns', () => {
    render(<PostSession turns={turns} config={config} onRestart={vi.fn()} />)
    expect(screen.getByText('Tell me about yourself.')).toBeInTheDocument()
    expect(screen.getByText('I am passionate about medicine.')).toBeInTheDocument()
  })

  it('labels interviewer and student turns', () => {
    render(<PostSession turns={turns} config={config} onRestart={vi.fn()} />)
    expect(screen.getByText(/Dr\. Lauren/i)).toBeInTheDocument()
    expect(screen.getAllByText(/You/i).length).toBeGreaterThan(0)
  })

  it('renders Start New Interview button', () => {
    render(<PostSession turns={turns} config={config} onRestart={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start new interview/i })).toBeInTheDocument()
  })

  it('calls onRestart when button is clicked', () => {
    const onRestart = vi.fn()
    render(<PostSession turns={turns} config={config} onRestart={onRestart} />)
    fireEvent.click(screen.getByRole('button', { name: /start new interview/i }))
    expect(onRestart).toHaveBeenCalled()
  })
})
