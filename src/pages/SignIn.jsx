import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
function isStrongPassword(pw) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pw)
}

export default function SignIn() {
  const { signIn, loading } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)

  const emailInvalid = email.length > 0 && !isValidEmail(email)
  const passwordInvalid = password.length > 0 && !isStrongPassword(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!isValidEmail(email)) return setError('Please enter a valid email')
    if (!isStrongPassword(password)) return setError('Password must be 8+ chars with uppercase, lowercase, number & symbol')

    try {
      await signIn(email, password)
      nav('/')
    } catch (err) {
      setError(err?.message || 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
          <img src="/ip-location.png" alt="Logo" className="w-10 h-10" />
        </div>
        <h1 className="text-lg font-bold">Geo Trace</h1>
        <p className="text-neutral-400">IP Geolocation Platform</p>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-neutral-800 rounded-2xl shadow-2xl px-4 py-8">
          <h2 className="text-lg font-bold text-center mb-2">Welcome Back</h2>
          <p className="text-center text-neutral-400 mb-8 text-xs">Log in to your account</p>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-xs">
              {error}
            </div>
          )}

          {emailInvalid && !error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-xs">
              {emailInvalid ? 'Invalid email address' : ' '}
            </div>
          )}

          {passwordInvalid && !error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-xs">
              {passwordInvalid ? '8+ chars • Uppercase • Number • Symbol' : ' '}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" aria-hidden="true" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-12 pr-4 py-3 bg-neutral-900 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  emailInvalid ? 'border-red-500' : 'border-neutral-700'
                }`}
                aria-label="Email address"
                aria-invalid={emailInvalid ? 'true' : 'false'}
                aria-describedby={emailInvalid ? 'email-error' : undefined}
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-12 pr-12 py-3 bg-neutral-900 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  passwordInvalid ? 'border-red-500' : 'border-neutral-700'
                }`}
                aria-label="Password"
                aria-invalid={passwordInvalid ? 'true' : 'false'}
                aria-describedby={passwordInvalid ? 'password-error' : undefined}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-neutral-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
