import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreSession } from './PreSession'

describe('PreSession', () => {
  it('renders specialty selector', () => {
    render(<PreSession onStart={vi.fn()} />)
    expect(screen.getByText(/Internal Medicine/i)).toBeInTheDocument()
  })

  it('renders interview mode options', () => {
    render(<PreSession onStart={vi.fn()} />)
    expect(screen.getByText(/Behavioral/i)).toBeInTheDocument()
    expect(screen.getByText(/Clinical/i)).toBeInTheDocument()
  })

  it('renders Start Interview button', () => {
    render(<PreSession onStart={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start interview/i })).toBeInTheDocument()
  })

  it('calls onStart with selected specialty and mode', () => {
    const onStart = vi.fn()
    render(<PreSession onStart={onStart} />)
    fireEvent.click(screen.getByRole('button', { name: /start interview/i }))
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ specialty: 'internal-medicine' })
    )
  })
})
