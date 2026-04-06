import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const API = 'https://job-tracker-8xwj.onrender.com'

const STATUSES = ['all', 'applied', 'phone_screen', 'technical_test', 'interview', 'final_interview', 'offer', 'rejected', 'no_response']

const STATUS_COLORS = {
  applied: 'bg-blue-500/20 text-blue-400',
  phone_screen: 'bg-yellow-500/20 text-yellow-400',
  technical_test: 'bg-purple-500/20 text-purple-400',
  interview: 'bg-orange-500/20 text-orange-400',
  final_interview: 'bg-pink-500/20 text-pink-400',
  offer: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  no_response: 'bg-gray-500/20 text-gray-400',
}

const STATUS_CHART_COLORS = {
  applied: '#3b82f6',
  phone_screen: '#eab308',
  technical_test: '#a855f7',
  interview: '#f97316',
  final_interview: '#ec4899',
  offer: '#22c55e',
  rejected: '#ef4444',
  no_response: '#6b7280',
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
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [toast, setToast] = useState(null)

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

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function handleUpdateStatus(id, status) {
    fetch(`${API}/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(updated => {
        if (!updated.id) return
        setJobs(prev => prev.map(j => j.id === id ? updated : j))
      })
      .catch(err => setError(err.message))
  }

  function handleDeleteJob(id) {
    fetch(`${API}/jobs/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    })
      .then(() => {
        setJobs(prev => prev.filter(j => j.id !== id))
        showToast('Job deleted!')
      })
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
        showToast('Job updated!')
      })
      .catch(err => setError(err.message))
  }

  function getChartData() {
    const counts = {}
    jobs.forEach(job => {
      counts[job.status] = (counts[job.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({ name: status, value: count }))
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
        showToast('Job added!')
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
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold">🎯 Job Tracker</h1>
      <button
        onClick={() => { setToken(null); setUsername(''); setPassword(''); setError(null) }}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg text-sm"
      >
        Logout
      </button>
    </div>

      {/* Dashboard */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <div className="flex items-center gap-8">
          <PieChart width={200} height={200}>
            <Pie
              data={getChartData()}
              cx={100}
              cy={100}
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
            >
              {getChartData().map((entry, index) => (
              <Cell key={index} fill={STATUS_CHART_COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
          </PieChart>
          <div className="flex flex-col gap-2">
            <p className="text-gray-400 text-sm">Total: <span className="text-white font-semibold">{jobs.length}</span></p>
            {getChartData().map(item => (
              <p key={item.name} className="text-gray-400 text-sm">{item.name}: <span className="text-white">{item.value}</span></p>
            ))}
          </div>
        </div>
      </div>

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
                className="px-3 py-1 rounded-full text-sm font-medium cursor-pointer border-0 outline-none"
                style={{ backgroundColor: STATUS_CHART_COLORS[job.status] + '33', color: STATUS_CHART_COLORS[job.status] }}
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
                      onClick={() => setConfirmDeleteId(job.id)}
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

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col gap-4 w-72">
            <p className="text-white font-medium">Delete this job?</p>
            <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDeleteJob(confirmDeleteId); setConfirmDeleteId(null) }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
