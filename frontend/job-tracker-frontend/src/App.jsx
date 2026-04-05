import { useState, useEffect } from 'react'

const API = 'https://job-tracker-8xwj.onrender.com'

const STATUSES = ['all', 'applied', 'phone_screen', 'technical_test', 'interview', 'final_interview', 'offer', 'rejected', 'withdrawn', 'ghosted']

const STATUS_COLORS = {
  applied: 'bg-blue-500/20 text-blue-400',
  phone_screen: 'bg-yellow-500/20 text-yellow-400',
  technical_test: 'bg-purple-500/20 text-purple-400',
  interview: 'bg-orange-500/20 text-orange-400',
  final_interview: 'bg-pink-500/20 text-pink-400',
  offer: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  withdrawn: 'bg-gray-500/20 text-gray-400',
  ghosted: 'bg-gray-500/20 text-gray-400',
}

function App() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [newJob, setNewJob] = useState({ 
    company: '', 
    position: '', 
    status: 'applied',
    location: '',
    source: '',
    job_type: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [token, setToken] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})

  useEffect(() => {
    if (!token)
      return
    setFetching(true)
    const url = filter === 'all' ? `${API}/jobs/` : `${API}/jobs/?status=${filter}`
    fetch(url, { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          setError('Failed to load jobs')
          return
        }
        setJobs(data); setLoading(false); setFetching(false)
      })
      .catch(err => { setError(err.message); setLoading(false); setFetching(false) })
  }, [filter, token])

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
      setToken('Bearer ' + data.access_token)
    })
      .catch(err => setError(err.message))
  }

  function handleUpdateStatus(id, status) {
    fetch(`${API}/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(updated => {
        setJobs(prev => prev.map(j => j.id === id ? updated : j))
      })
      .catch(err => setError(err.message))
  }

  function handleDeleteJob(id) {
    fetch(`${API}/jobs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    })
      .then(() => setJobs(prev => prev.filter(j => j.id !== id)))
      .catch(err => setError(err.message))
  }

  function handleSaveEdit(id) {
    fetch(`${API}/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    })
      .then(res => res.json())
      .then(updated => {
        setJobs(prev => prev.map(j => j.id === id ? updated : j))
        setEditingId(null)
        setEditData({})
      })
      .catch(err => setError(err.message))
  }

  function handleAddJob() {
    setSubmitting(true)
    fetch(`${API}/jobs/`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    })
      .then(res => res.json())
      .then(data => {
        setJobs(prev => [data, ...prev])  // 新job插到列表最前面
        setNewJob({ company: '', position: '', status: 'applied', location: '', source: '', job_type: '' })
        setShowForm(false)
        setSubmitting(false)
      })
      .catch(err => { setError(err.message); setSubmitting(false) })
  }

  if (!token)
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 flex flex-col gap-4 w-80">
          <h1 className="text-2xl font-bold">🎯 Job Tracker</h1>
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
            className="bg-blue-600 hover:bg-blue-500 rounded-lg py-2 font-medium"
          >
            {isRegistering ? 'Register' : 'Login'}
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

  if (loading) return <div className="p-8 text-white">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🎯 Job Tracker</h1>

       <button
        onClick={() => setShowForm(prev => !prev)}
        className="mb-6 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
      >
        {showForm ? '✕ Cancel' : '+ Add Job'}
      </button>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-8 flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              placeholder="Company *"
              value={newJob.company}
              onChange={e => setNewJob(prev => ({ ...prev, company: e.target.value }))}
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
            />
            <input
              placeholder="Position *"
              value={newJob.position}
              onChange={e => setNewJob(prev => ({ ...prev, position: e.target.value }))}
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <input
              placeholder="Location"
              value={newJob.location}
              onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))}
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
            />
            <input
              placeholder="Source (LinkedIn, Indeed...)"
              value={newJob.source}
              onChange={e => setNewJob(prev => ({ ...prev, source: e.target.value }))}
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
            />
            <select
              value={newJob.status}
              onChange={e => setNewJob(prev => ({ ...prev, status: e.target.value }))}
              className="bg-gray-700 rounded-lg px-4 py-2 text-white outline-none"
            >
              {STATUSES.filter(s => s !== 'all').map(s => (
                <option key={s} value={s} className="bg-gray-800 text-white">{s}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddJob}
              disabled={submitting || !newJob.company || !newJob.position}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all
              ${filter === s ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className={`grid gap-4 transition-opacity ${fetching ? 'opacity-40' : 'opacity-100'}`}>
        {jobs.map(job => (
          <div
            key={job.id}
            className="bg-gray-800 rounded-xl p-6"
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
            >
              <div>
                <h2 className="text-xl font-semibold">{job.company}</h2>
                <p className="text-gray-400">{job.position}</p>
              </div>
              <select
                value={job.status}
                onChange={e => { e.stopPropagation(); handleUpdateStatus(job.id, e.target.value) }}
                className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer border-0 outline-none ${STATUS_COLORS[job.status] || 'bg-gray-500/20 text-gray-400'}`}
                onClick={e => e.stopPropagation()}
              >
                {STATUSES.filter(s => s !== 'all').map(s => (
                  <option key={s} value={s} className="bg-gray-800 text-white">{s}</option>
                ))}
              </select>
            </div>

          {expandedId === job.id && (
            <div className="mt-4 pt-4 border-t border-gray-700 text-sm flex flex-col gap-2">
              {editingId === job.id ? (
                <>
                  <label className="text-gray-500 text-xs">Company</label>
                  <input
                    value={editData.company || ''}
                    onChange={e => setEditData(prev => ({ ...prev, company: e.target.value }))}
                    className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                  />
                  <label className="text-gray-500 text-xs">Position</label>
                  <input
                    value={editData.position || ''}
                    onChange={e => setEditData(prev => ({ ...prev, position: e.target.value }))}
                    className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                  />
                  <label className="text-gray-500 text-xs">Location</label>
                  <input
                    value={editData.location || ''}
                    onChange={e => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                  />
                  <label className="text-gray-500 text-xs">Source URL</label>
                  <input
                    value={editData.source || ''}
                    onChange={e => setEditData(prev => ({ ...prev, source: e.target.value }))}
                    className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                  />
                  <label className="text-gray-500 text-xs">Job Type</label>
                  <input
                    value={editData.job_type || ''}
                    onChange={e => setEditData(prev => ({ ...prev, job_type: e.target.value }))}
                    className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                  />
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      onClick={() => { setEditingId(null); setEditData({}) }}
                      className="px-3 py-1 bg-gray-700 text-gray-400 hover:bg-gray-600 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(job.id)}
                      className="px-3 py-1 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-lg text-xs"
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-gray-400 flex flex-col gap-1">
                    {job.location && <p>📍 {job.location}</p>}
                    {job.source && <p>🔗 <a href={job.source} target="_blank" className="text-blue-400 hover:underline">{job.source}</a></p>}
                    {job.job_type && <p>💼 {job.job_type}</p>}
                    {job.deadline && <p>⏰ {job.deadline}</p>}
                  </div>
                  <div className="flex gap-2 justify-end mt-1">
                    <button
                      onClick={() => { setEditingId(job.id); setEditData({ company: job.company || '', position: job.position || '', location: job.location || '', source: job.source || '', job_type: job.job_type || '' }) }}
                      className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          </div>
        ))}
        {jobs.length === 0 && !fetching && <p className="text-gray-500">No jobs found.</p>}
      </div>
    </div>
  )
}

export default App
