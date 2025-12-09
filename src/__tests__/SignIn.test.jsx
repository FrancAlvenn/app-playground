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
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'bad' } })
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'StrongP@ss1' } })
    fireEvent.click(screen.getByText('Login'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email')
  })
})
