import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>
  if (!user) return <Navigate to="/signin" replace />
  return <>{children}</>
}
