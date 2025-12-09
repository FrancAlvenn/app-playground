import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()
  const name = user?.displayName || user?.email || 'User'
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-neutral-800 p-6 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-2">Hello {name}</h1>
        <p className="text-neutral-400 text-sm mb-4">You are logged in.</p>
        <button className="rounded-md bg-neutral-700 hover:bg-neutral-600 p-3" onClick={logout}>Logout</button>
      </div>
    </div>
  )
}
