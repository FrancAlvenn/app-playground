import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute'
import { AuthProvider } from '../auth/AuthContext'

describe('ProtectedRoute', () => {
  it('renders loading initially within provider', () => {
    const { container } = render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div>Secret</div>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>
    )
    expect(container.textContent).toContain('Loading')
  })
})
