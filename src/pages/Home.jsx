import { useEffect, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { useAuth } from '../auth/AuthContext'
import { Check, Globe2, LogOut, MapPin, Search, Trash, Trash2, X } from 'lucide-react'

function isValidIpOrDomain(value) {
  const v = String(value || '').trim()
  const ipv4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/
  const domain = /^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.(?:[A-Za-z]{2,63})(?:\.[A-Za-z]{2,63})*$/
  return ipv4.test(v) || domain.test(v)
}

export default function Home() {
  const { user, logout } = useAuth()
  const baseUrl = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000'
  const api = `${baseUrl}/api`
  const name = user?.displayName || user?.email
  const token = useMemo(() => localStorage.getItem('access_token') || '', [])

  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [activeKey, setActiveKey] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token])
  const errorTimerRef = useRef(null)
  const storageKey = useMemo(() => (user?.id ? `ip_history:${user.id}` : 'ip_history:anon'), [user])
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)

  async function getCsrf() {
    const res = await fetch(`${api}/csrf`, { credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    return data.csrfToken
  }

  const formatTs = (ts) => {
    const d = new Date(ts)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const mi = String(d.getMinutes()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
  }

  async function fetchCurrent() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${api}/ip/current`, { headers, credentials: 'include' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed to load current IP')
      const data = await res.json()
      setCurrent(data)
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${api}/ip/history`, { headers, credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const serverItems = Array.isArray(data.items) ? data.items : []
      const localItems = (() => {
        try {
          const raw = localStorage.getItem(storageKey)
          const parsed = raw ? JSON.parse(raw) : []
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })()
      const merged = [...serverItems, ...localItems]
      merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      const deduped = []
      const seen = new Set()
      for (const it of merged) {
        const key = `${it.searchedIP}-${it.timestamp}`
        if (seen.has(key)) continue
        seen.add(key)
        deduped.push(it)
      }
      setHistory(deduped)
      try {
        localStorage.setItem(storageKey, JSON.stringify(deduped))
      } catch {
        setError('Failed to save history')
      }
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCurrent()
    fetchHistory()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(history))
    } catch {
      setError('Failed to save history')
    }
  }, [history, storageKey])

  useEffect(() => {
    const v = query.trim()
    if (isValidIpOrDomain(v)) {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current)
        errorTimerRef.current = null
      }
      setError('')
    }
  }, [query])

  async function onSearch() {
    const q = query.trim()
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
    setError('')
    if (!isValidIpOrDomain(q)) {
      errorTimerRef.current = setTimeout(() => setError('Invalid IP or domain'), 300)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${api}/ip/lookup?ip=${encodeURIComponent(q)}`, { headers, credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Lookup failed')
      setCurrent(data)
      setActiveKey(`${data.ip}-${Date.now()}`)
      // setHistory((prev) => [{ userId: user?.id, searchedIP: data.ip, timestamp: Date.now(), geolocationData: data.geo }, ...prev])
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
      fetchHistory()
    }
  }

  function onClear() {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current)
      errorTimerRef.current = null
    }
    setQuery('')
    setError('')
    setActiveKey('')
    fetchCurrent()
  }

  const toggleSelect = (key) => {
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const selectAll = () => {
    const keys = history.map((h) => h.id || `${h.searchedIP}-${h.timestamp}`)
    setSelectedIds(keys)
  }

  const deselectAll = () => setSelectedIds([])

  const deleteSelected = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    const keySet = new Set(selectedIds)
    const ids = history.filter((h) => keySet.has(h.id || `${h.searchedIP}-${h.timestamp}`) && h.id).map((h) => h.id)
    if (ids.length === 0) {
      setShowDeleteConfirm(false)
      setError('No deletable items selected')
      return
    }
    setLoading(true)
    try {
      const csrf = await getCsrf()
      const res = await fetch(`${api}/ip/history/delete`, {
        method: 'POST',
        headers: { ...headers, 'x-xsrf-token': csrf, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to delete history')
      const items = Array.isArray(data.items) ? data.items : []
      setHistory(items)
      setSelectedIds([])
      setShowDeleteConfirm(false)
      try {
        localStorage.setItem(storageKey, JSON.stringify(items))
      } catch {
        setError('Failed to delete history')
      }
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const cancelDelete = () => setShowDeleteConfirm(false)

  const onHistoryClick = async (item) => {
    const key = item.id || `${item.searchedIP}-${item.timestamp}`
    setActiveKey(key)
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${api}/ip/lookup?ip=${encodeURIComponent(item.searchedIP)}`, { headers, credentials: 'include' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Lookup failed')
      setCurrent(data)
    } catch (e) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  const info = current?.geo || {}
  const meta = [
    { label: 'Country', value: info.country },
    { label: 'Region', value: info.regionName },
    { label: 'City', value: info.city },
    { label: 'ISP', value: info.isp },
    { label: 'Timezone', value: info.timezone },
  ].filter((x) => x.value)

useEffect(() => {
  if (!mapContainerRef.current) return
  if (!current?.geo?.lat || !current?.geo?.lon) {
    setMapReady(false)
    return
  }

  // Destroy old map
  if (mapInstanceRef.current) {
    mapInstanceRef.current.remove()
    mapInstanceRef.current = null
  }

  const container = mapContainerRef.current
  container.innerHTML = '' // Critical: empty container

  try {
    const map = new maplibregl.Map({
      container,
      style: 'https://tiles.openfreemap.org/styles/bright', // EXACTLY the style you want
      center: [current.geo.lon, current.geo.lat],
      zoom: 12,
      pitch: 30,        // Slight 3D tilt (looks premium)
      bearing: -10,     // Slight rotation for style
    })

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right')

    // Enable this if we want to show the popup modal on map creation, this is removed because when in mobile view the popup takes a lot of space

    // Beautiful marker + popup (just like the demo)
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      offset: 25,
      className: 'custom-popup'
    }).setHTML(`
      <div style="font-family: system-ui, sans-serif; padding: 4px 0;">
        <strong style="font-size: 14px; color: #1e40af;">${current.geo.city || 'Unknown Location'}</strong><br/>
        <span style="color: #6b7280; font-size: 12px;">
          ${current.geo.regionName ? current.geo.regionName + ', ' : ''}${current.geo.country || 'N/A'}
        </span><br/>
        <span style="margin: 6px 0; display: block; height: 1px; background: #e5e7eb;"></span>
        <div style="font-size: 12px; color: #374151;">
          <strong>ISP:</strong> ${current.geo.isp || 'Unknown'}<br/>
          <strong>IP:</strong> <code style="background:#f3f4f6; padding:2px 6px; border-radius:4px; font-size:11px;">${current.ip}</code>
        </div>
      </div>
    `)

    const marker = new maplibregl.Marker({
      color: '#3b82f6',
      scale: 1.1
    })
      .setLngLat([current.geo.lon, current.geo.lat])
      .setPopup(popup)
      .addTo(map)

    // Open popup immediately
    // marker.togglePopup()

    // Smooth fly-in animation
    map.flyTo({
      center: [current.geo.lon, current.geo.lat],
      zoom: 14,
      duration: 2000,
      essential: true
    })

    map.on('load', () => setMapReady(true))
    mapInstanceRef.current = map

  } catch (err) {
    console.error('Map error:', err)
    setMapError('Failed to load map')
  }

  return () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }
  }
}, [current?.geo?.lat, current?.geo?.lon, current?.ip])

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between pb-3 mb-5 border-b border-neutral-700">
          <div className="flex items-center gap-2">
            <img src={'./ip-location.png'} alt="Geo Trace Logo" className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Geo Trace</h1>
              <p className="text-neutral-400 text-xs">Hello {name}</p>
            </div>
          </div>
          <button className="rounded-md bg-neutral-700 hover:bg-neutral-600 px-2 py-2 text-sm" onClick={() => setShowLogoutModal(true)}><LogOut className="w-4 h-4 text-white" /></button>
        </header>

        <div className="flex flex-col gap-3">
            {/* Map Section */}
            <section className="bg-neutral-800 rounded-xl shadow overflow-hidden">
              <div className="relative">
                <div
                  ref={mapContainerRef} 
                  id="ip-map"
                  className="w-full h-64 lg:h-80"
                />

                {!mapReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/90 z-10">
                    <img src="./bg-map.png" alt="" className='w-full h-full object-cover absolute blur-sm' />
                    <div className="text-center z-10 p-5 bg-neutral-900/50 rounded-md">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-white"></div>
                      <p className="mt-3 text-sm text-neutral-200">Loading map...</p>
                    </div>
                  </div>
                )}

                {/* ERROR OVERLAY */}
                {mapError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 z-10">
                    <p className="text-red-300 text-sm px-4 text-center">{mapError}</p>
                  </div>
                )}
              </div>
            </section>
          {/* Current IP */}
          <section className="bg-neutral-800 rounded-xl p-5 shadow">
            <div className="flex items-center gap-2 mb-3">
              <Globe2 className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold">Current IP & Location</h2>
            </div>
            {loading ? (
              <div className="text-neutral-400 text-sm">Loading...</div>
            ) : current ? (
              <div>
                <div className="font-mono bg-neutral-900 px-2 py-1 rounded mb-3">{current.ip}</div>
                <div className="flex items-center gap-2 text-sm pb-2">
                  {info.city && (
                    <span className="flex items-center gap-1 text-neutral-300"><MapPin className="w-3 h-3" /> {info.city}, {info.regionName}, {info.country}</span>
                  )}
                </div>
                {meta.length > 0 && (
                  <dl className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2 text-xs text-neutral-300">
                    {meta.map((m) => (
                      <div key={m.label} className="flex gap-2 whitespace-norm">
                        <dt className="text-neutral-400">{m.label}</dt>
                        <dd className="font-medium">{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            ) : (
              <div className="text-neutral-400 text-sm">No data</div>
            )}
          </section>

          <section className="bg-neutral-900 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-3">
              {/* <Search className="w-4 h-4 text-blue-400" aria-hidden="true" /> */}
              {/* <h2 className="text-sm font-semibold">Search IP or Domain</h2> */}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 8.8.8.8 or example.com"
              className={`w-full mb-1 pr-4 pl-4 py-3 bg-neutral-900 border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-500' : 'border-neutral-700'}`}
              aria-invalid={error ? 'true' : 'false'}
            />
            {error && <div role="alert" className={`my-1 min-h-[16px] text-xs transition-opacity duration-150 ease-out ${error ? 'text-red-400 opacity-100' : 'opacity-0'}`}>{error || ' '}</div>}
            <div className="flex gap-2 mt-2">
              <button onClick={onSearch} disabled={loading} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-xs font-semibold w-full transition-colors">Search</button>
              <button onClick={onClear} className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md text-xs font-semibold w-full transition-colors">Clear</button>
            </div>
          </section>

          <section className="bg-neutral-800 rounded-xl p-5 mt-2 shadow md:col-span-2">
            <div className="flex items-start justify-between mb-3 gap-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold">Search History</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectedIds.length === history.length && history.length > 0 ? deselectAll : selectAll}
                  className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-md text-xs flex items-center"
                >
                  <span className="block sm:hidden">
                    {selectedIds.length === history.length && history.length > 0 ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </span>
                  <span className="hidden sm:block">
                    {selectedIds.length === history.length && history.length > 0 ? 'Deselect All' : 'Select All'}
                  </span>
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={selectedIds.length === 0}
                  className="px-2 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-md text-xs flex items-center"
                >
                  <Trash className="w-4 h-4 block sm:hidden" />
                  <span className="hidden sm:flex items-center gap-1">
                    <Trash className="w-3 h-3" /> Delete Selected
                  </span>
                </button>
              </div>
            </div>
            {history.length === 0 ? (
              <p className="text-neutral-400 text-xs">No history yet</p>
            ) : (
              <ul className="divide-y divide-neutral-700 max-h-64 overflow-y-auto">
                {history.map((item) => {
                  const key = item.id || `${item.searchedIP}-${item.timestamp}`
                  const active = key === activeKey
                  const checked = selectedIds.includes(key)
                  return (
                    <li
                      key={key}
                      onClick={() => onHistoryClick(item)}
                      className={`py-2 px-2 flex items-center justify-between text-xs cursor-pointer transition-colors ${active ? 'bg-neutral-700' : 'bg-transparent hover:bg-neutral-900'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          aria-label={`select ${item.searchedIP}`}
                          checked={checked}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSelect(key)
                          }}
                          className="accent-blue-500"
                        />
                        <span className="font-mono">{item.searchedIP}</span>
                      </div>
                      <span className="text-neutral-400">{formatTs(item.timestamp)}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Logout confirmation modal*/}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-neutral-800 p-5 rounded-md shadow-md">
          <p className="text-neutral-100 text-sm">Are you sure you want to logout?</p>
          <div className="flex gap-2 mt-4">
            <button onClick={() => setShowLogoutModal(false)} className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md text-xs font-semibold">Cancel</button>
            <button onClick={logout} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-xs font-semibold">Logout</button>
          </div>
        </div>
      </div>)}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 p-5 rounded-md shadow-md">
            <p className="text-neutral-100 text-sm">Delete selected history items?</p>
            <div className="flex gap-2 mt-4">
              <button onClick={cancelDelete} className="px-3 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-md text-xs font-semibold">Cancel</button>
              <button onClick={confirmDelete} className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-md text-xs font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
