import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import ProtectedRoute from '../auth/ProtectedRoute'
import { AuthProvider } from '../auth/AuthContext'

describe('ProtectedRoute', () => {
  it('renders loading initially within provider', () => {
    const { container } = render(
      <AuthProvider>
        <ProtectedRoute>
          <div>Secret</div>
        </ProtectedRoute>
      </AuthProvider>
    )
    expect(container.textContent).toContain('Loading')
  })
})
