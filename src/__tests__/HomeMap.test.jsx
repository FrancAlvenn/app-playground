import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AuthProvider } from '../auth/AuthContext'
import Home from '../pages/Home'

describe('Home Map', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.setItem('access_token', 'test-token')
    // stub Leaflet
    global.window.L = {
      map: vi.fn(() => ({ flyTo: vi.fn() })),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      marker: vi.fn(() => ({ addTo: vi.fn(), setLatLng: vi.fn() })),
    }
  })

  it('initializes map and updates marker on current IP load', async () => {
    global.fetch = vi.fn()
      // AuthContext /me
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: { id: 'u1', email: 'test@example.com' } }) })
      // Home current
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '1.2.3.4', geo: { lat: 16.4164, lon: 120.5931, country: 'PH', regionName: 'Cordillera', city: 'Baguio' } }) })
      // Home history
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: [] }) })
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    )
    expect(await screen.findByText(/1\.2\.3\.4/)).toBeInTheDocument()
    expect(window.L.map).toHaveBeenCalled()
    expect(window.L.marker).toHaveBeenCalled()
  })

  it('updates map on lookup with new coordinates', async () => {
    global.fetch = vi.fn()
      // AuthContext /me
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ user: { id: 'u1', email: 'test@example.com' } }) })
      // current
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '1.1.1.1', geo: { lat: 0, lon: 0 } }) })
      // history
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: [] }) })
      // lookup
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ip: '8.8.8.8', geo: { country: 'US', lat: 37.4056, lon: -122.0775 } }) })
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    )
    await screen.findByText(/1\.1\.1\.1/)
    // trigger search by updating input and clicking button
    const input = screen.getAllByPlaceholderText('e.g. 8.8.8.8 or example.com')[0]
    fireEvent.change(input, { target: { value: '8.8.8.8' } })
    const btns = screen.getAllByRole('button', { name: 'Search' })
    fireEvent.click(btns[0])
    expect(await screen.findByText(/8\.8\.8\.8/)).toBeInTheDocument()
    // After update, marker should be set
    expect(window.L.marker).toHaveBeenCalled()
  })
})
