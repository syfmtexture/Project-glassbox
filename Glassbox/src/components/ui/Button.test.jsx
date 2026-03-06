import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Button from './Button'

describe('Button Component', () => {
    it('renders with children correctly', () => {
        render(<Button>Click Me</Button>)
        expect(screen.getByText('Click Me')).toBeInTheDocument()
    })

    it('renders loading state correctly', () => {
        const { container } = render(<Button loading>Submit</Button>)
        expect(container.querySelector('.spinner')).toBeInTheDocument()
    })

    it('is disabled when loading prop is true', () => {
        render(<Button loading>Submit</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })

    it('is disabled when disabled prop is true', () => {
        render(<Button disabled>Submit</Button>)
        expect(screen.getByRole('button')).toBeDisabled()
    })
})
