import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../auth/AuthContext'
import Home from '../pages/Home'

describe('Home', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.setItem('access_token', 'test-token')
  })

  it('shows current IP on load', async () => {
    vi.stubGlobal('fetch', vi.fn())
      // AuthContext /me
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: { id: 'u1', email: 'test@example.com' } }) })
      // Home current
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '1.2.3.4', geo: { country: 'US', regionName: 'CA', city: 'SF' } }) })
      // Home history
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: [] }) })
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    )
    expect(await screen.findByText(/1\.2\.3\.4/)).toBeInTheDocument()
  })

  it('shows error on invalid IP', async () => {
    vi.stubGlobal('fetch', vi.fn())
      // AuthContext /me
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: { id: 'u1', email: 'test@example.com' } }) })
      // Home current
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '5.6.7.8', geo: {} }) })
      // Home history
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: [] }) })
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    )
    fireEvent.change(screen.getAllByPlaceholderText('e.g. 8.8.8.8 or example.com')[0], { target: { value: 'bad' } })
    fireEvent.click(screen.getByText('Search'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid IP or domain')
  })

  it('updates current on successful lookup', async () => {
    vi.stubGlobal('fetch', vi.fn())
      // AuthContext /me
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: { id: 'u1', email: 'test@example.com' } }) })
      // current
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '1.1.1.1', geo: {} }) })
      // history
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: [] }) })
      // lookup
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '8.8.8.8', geo: { country: 'US' } }) })

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    )
    await screen.findByText(/1\.1\.1\.1/)
    fireEvent.change(screen.getAllByPlaceholderText('e.g. 8.8.8.8 or example.com')[0], { target: { value: '8.8.8.8' } })
    fireEvent.click(screen.getByText('Search'))
    await waitFor(() => expect(screen.getByText(/8\.8\.8\.8/)).toBeInTheDocument())
  })
})
