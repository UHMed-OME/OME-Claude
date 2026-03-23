import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LiveSession } from './LiveSession'

vi.mock('../../hooks/useNavtalkSession', () => ({
  useNavtalkSession: () => ({
    status: 'listening',
    cameraStream: null,
    startSession: vi.fn(),
    endSession: vi.fn(),
    setVideoElement: vi.fn(),
    toggleMute: vi.fn(),
  }),
}))

const config = { specialty: 'internal-medicine' as const, mode: 'behavioral' as const }

describe('LiveSession', () => {
  it('renders status indicator', () => {
    render(<LiveSession config={config} onEnd={vi.fn()} onTranscript={vi.fn()} />)
    expect(screen.getByText(/listening/i)).toBeInTheDocument()
  })

  it('renders end interview button', () => {
    render(<LiveSession config={config} onEnd={vi.fn()} onTranscript={vi.fn()} />)
    expect(screen.getByRole('button', { name: /end interview/i })).toBeInTheDocument()
  })

  it('renders mute button', () => {
    render(<LiveSession config={config} onEnd={vi.fn()} onTranscript={vi.fn()} />)
    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
  })

  it('calls onEnd when end interview is clicked', () => {
    const onEnd = vi.fn()
    render(<LiveSession config={config} onEnd={onEnd} onTranscript={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /end interview/i }))
    expect(onEnd).toHaveBeenCalled()
  })
})
