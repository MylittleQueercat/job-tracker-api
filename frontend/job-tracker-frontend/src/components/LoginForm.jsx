import { useState } from 'react'

const API = 'https://job-tracker-8xwj.onrender.com'

// Login and registration form shown when user is not authenticated
export default function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleRegister() {
    fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.detail) {
          setError(typeof data.detail === 'string' ? data.detail : 'Registration failed')
          return
        }
        setIsRegistering(false)
        setError(null)
      })
      .catch(err => setError(err.message))
  }

  function handleLogin() {
    setLoading(true)
    setError(null)
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)

    fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    })
      .then(res => res.json())
      .then(data => {
        if (!data.access_token) {
          setError('Invalid username or password')
          return
        }
        const t = 'Bearer ' + data.access_token
        localStorage.setItem('token', t)
        onLogin(t)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a1a 100%)' }}>
      <div className="bg-gray-800 rounded-xl p-8 flex flex-col gap-4 w-80">
        <div className="text-center">
          <h1 className="text-2xl font-bold"
            style={{ background: 'linear-gradient(90deg, #f72585, #7209b7, #4cc9f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🎯 Job Tracker
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your journey to your dream job</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="bg-gray-700 rounded-lg px-4 py-2 outline-none"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="bg-gray-700 rounded-lg px-4 py-2 outline-none"
        />

        <button
          onClick={isRegistering ? handleRegister : handleLogin}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              {isRegistering ? 'Registering...' : 'Logging in...'}
            </span>
          ) : (
            isRegistering ? 'Register' : 'Login'
          )}
        </button>
        <button
          onClick={() => { setIsRegistering(prev => !prev); setError(null) }}
          className="text-gray-400 text-sm hover:text-white"
        >
          {isRegistering ? 'Already have an account? Login' : 'No account? Register'}
        </button>
      </div>
    </div>
  )
}