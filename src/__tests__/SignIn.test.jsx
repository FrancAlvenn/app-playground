import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '../auth/AuthContext'
import { MemoryRouter } from 'react-router-dom'
import SignIn from '../pages/SignIn'

describe('SignIn', () => {
  it('shows error for invalid email', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <SignIn />
        </MemoryRouter>
      </AuthProvider>
    )
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'bad' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'StrongP@ss1' } })
    const btn = screen.getByRole('button', { name: /sign in/i })
    fireEvent.submit(btn.closest('form'))
    expect(await screen.findByText('Invalid email')).toBeInTheDocument()
  })
})
