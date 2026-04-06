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

const MOTIVATIONS = [
  "Every rejection is one step closer to your offer. 💪",
  "Your dream job is looking for you too. 🌟",
  "Keep going. The right company will see your value. 🚀",
  "One application at a time. You've got this. ✨",
  "Great things take time. Stay consistent. ✨",
  "Your next interview could change everything. 🔥",
  "Rejection is redirection. Keep pushing. 💫",
  "The best is yet to come. Apply anyway. 🌈",
]

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
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [newInterview, setNewInterview] = useState({ round: 1, interview_type: '', date: '', notes: '' })
  const [editingInterviewId, setEditingInterviewId] = useState(null)
  const [editInterviewData, setEditInterviewData] = useState({})
  const [confirmDeleteInterviewId, setConfirmDeleteInterviewId] = useState(null)
  const [search, setSearch] = useState('')
  const [motivation] = useState(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)])
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    if (!token)
      return
    setFetching(true)
    const url = filter === 'all' ? `${API}/jobs/` : `${API}/jobs/?status=${filter}`
    authFetch(url)
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
      const t = 'Bearer ' + data.access_token
      localStorage.setItem('token', t)
      setToken(t)
    })
      .catch(err => setError(err.message))
  }

  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: { 'Authorization': token, ...options.headers }
    }).then(res => {
      if (res.status === 401) {
        localStorage.removeItem('token')
        setToken(null)
        setUsername('')
        setPassword('')
        throw new Error('Session expired, please login again')
      }
      return res
    })
  }

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  function handleUpdateStatus(id, status) {
    console.log('sending:', id, status)  // ← 加这行
    authFetch(`${API}/jobs/${id}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(updated => {
        console.log('response:', updated)  // ← 加这行
        if (!updated.id) return
        setJobs(prev => prev.map(j => j.id === id ? updated : j))
      })
      .catch(err => setError(err.message))
  }

  function handleDeleteJob(id) {
    authFetch(`${API}/jobs/${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        setJobs(prev => prev.filter(j => j.id !== id))
        showToast('Job deleted!')
      })
      .catch(err => setError(err.message))
  }

  function handleSaveEdit(id) {
    authFetch(`${API}/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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

  function highlight(text, query) {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} style={{background: 'linear-gradient(90deg, #f72585, #7209b7)', color: 'white', borderRadius: '3px', padding: '0 2px'}}>{part}</mark>
        : part
    )
  }

  function getChartData() {
    const counts = {}
    jobs.forEach(job => {
      counts[job.status] = (counts[job.status] || 0) + 1
    })
    return Object.entries(counts).map(([status, count]) => ({ name: status, value: count }))
  }

  function getHeatmapData() {
    const counts = {}
    jobs.forEach(job => {
      const date = job.created_at?.split('T')[0]
      if (date) counts[date] = (counts[date] || 0) + 1
    })
    
    const days = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days.push({ date: key, count: counts[key] || 0 })
    }
    return days
  }

  function handleAddJob() {
    setSubmitting(true)
    authFetch(`${API}/jobs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  function fetchInterviews(jobId) {
  authFetch(`${API}/jobs/${jobId}/interviews`)
    .then(res => res.json())
    .then(data => setInterviews(Array.isArray(data) ? data : []))
    .catch(err => setError(err.message))
}

  function handleAddInterview(jobId) {
    authFetch(`${API}/jobs/${jobId}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newInterview,
        round: parseInt(newInterview.round),
        date: newInterview.date || null
      })
    })
      .then(res => res.json())
      .then(data => {
        setInterviews(prev => [...prev, data])
        setNewInterview({ round: interviews.length + 2, interview_type: '', date: '', notes: '' })
        showToast('Interview added!')
      })
      .catch(err => setError(err.message))
  }

  function handleDeleteInterview(jobId, interviewId) {
    authFetch(`${API}/jobs/${jobId}/interviews/${interviewId}`, {
      method: 'DELETE',
    })
      .then(() => {
        setInterviews(prev => prev.filter(iv => iv.id !== interviewId))
        showToast('Interview deleted!')
      })
      .catch(err => setError(err.message))
  }

  function handleUpdateInterview(jobId, interviewId, data) {
    authFetch(`${API}/jobs/${jobId}/interviews/${interviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(updated => {
        setInterviews(prev => prev.map(iv => iv.id === interviewId ? updated : iv))
        showToast('Interview updated!')
      })
      .catch(err => setError(err.message))
  }

  if (!token)
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{background: 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a1a 100%)'}}>
        <div className="bg-gray-800 rounded-xl p-8 flex flex-col gap-4 w-80">
          <div className="text-center">
            <h1 className="text-2xl font-bold" style={{background: 'linear-gradient(90deg, #f72585, #7209b7, #4cc9f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
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
      <div className="min-h-screen p-8" style={{background: darkMode ? 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a1a 100%)' : 'linear-gradient(135deg, #f8f9ff 0%, #f0e6ff 50%, #e6f9ff 100%)', color: darkMode ? 'white' : '#1a0f2e'}}>
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">🎯 Job Tracker</h1>
        <p className="text-base italic mt-1" style={{color: '#4cc9f0'}}>{motivation}</p>
      </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDarkMode(prev => !prev)}
            className="px-4 py-2 rounded-lg text-sm border border-white/10 hover:border-white/30"
            style={{background: 'rgba(255,255,255,0.05)'}}
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
          <button
            onClick={() => { localStorage.removeItem('token'); setToken(null); setUsername(''); setPassword(''); setError(null) }}
            className="px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm border border-white/10 hover:border-white/30"
            style={{background: 'rgba(255,255,255,0.05)'}}
          >
            Logout
          </button>
        </div>
    </div>

      {/* Dashboard */}
      <div className="rounded-xl p-6 mb-6" style={{background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)'}}>
       <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Overview</h2>
          <span className="text-2xl font-extrabold" style={{background: 'linear-gradient(90deg, #f72585, #4cc9f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{jobs.length} Applications</span>
        </div>
      <div className="flex items-start gap-8 w-full">
        {/* 饼图 */}
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

        {/* 统计数字
        <div className="flex flex-col gap-2 min-w-36">
          <p className="text-gray-400 text-sm">Total: <span className="text-white font-semibold">{jobs.length}</span></p>
          {getChartData().map(item => (
            <p key={item.name} className="text-gray-400 text-sm">{item.name}: <span className="text-white">{item.value}</span></p>
          ))}
        </div> */}

        {/* 热力图 */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4 flex flex-col gap-1" style={{background:'rgba(247,37,133,0.1)', border:'1px solid rgba(247,37,133,0.2)'}}>
            <p className="text-2xl font-extrabold" style={{color:'#f72585'}}>{jobs.filter(j => j.status === 'interview' || j.status === 'final_interview').length}</p>
            <p className="text-gray-400 text-xs">Active Interviews</p>
          </div>
          <div className="rounded-xl p-4 flex flex-col gap-1" style={{background:'rgba(76,201,240,0.1)', border:'1px solid rgba(76,201,240,0.2)'}}>
            <p className="text-2xl font-extrabold" style={{color:'#4cc9f0'}}>{jobs.filter(j => j.status === 'offer').length}</p>
            <p className="text-gray-400 text-xs">Offers 🎉</p>
          </div>
          <div className="rounded-xl p-4 flex flex-col gap-1" style={{background:'rgba(114,9,183,0.1)', border:'1px solid rgba(114,9,183,0.2)'}}>
            <p className="text-2xl font-extrabold" style={{color:'#7209b7'}}>{jobs.length === 0 ? 0 : Math.round(jobs.filter(j => j.status === 'interview' || j.status === 'final_interview' || j.status === 'offer').length / jobs.length * 100)}%</p>
            <p className="text-gray-400 text-xs">Interview Rate</p>
          </div>
          <div className="rounded-xl p-4 flex flex-col gap-1" style={{background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)'}}>
            <p className="text-2xl font-extrabold text-white">{jobs.filter(j => j.status === 'applied' || j.status === 'phone_screen').length}</p>
            <p className="text-gray-400 text-xs">Awaiting Response</p>
          </div>
        </div>
        </div>
      </div>

       <button
        onClick={() => setShowForm(prev => !prev)}
        className="mb-6 px-4 py-2 rounded-lg text-sm font-bold text-white"
        style={{background: 'linear-gradient(90deg, #f72585, #7209b7)'}}
      >
        {showForm ? '✕ Cancel' : '+ Add Job'}
      </button>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-9 flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              placeholder="Company *"
              value={newJob.company}
              onChange={e => setNewJob(prev => ({ ...prev, company: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}}
            />
            <input
              placeholder="Position *"
              value={newJob.position}
              onChange={e => setNewJob(prev => ({ ...prev, position: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}}
            />
          </div>
          <div className="flex gap-3">
            <input
              placeholder="Location"
              value={newJob.location}
              onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}}
            />
            <input
              placeholder="Source (LinkedIn, Indeed...)"
              value={newJob.source}
              onChange={e => setNewJob(prev => ({ ...prev, source: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}}
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

      <input
        placeholder="🔍 Search company or position..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none mb-6"
        style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)'}}
      />

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${filter === s ? 'text-white border-transparent' : 'text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
            style={filter === s ? {background: 'linear-gradient(90deg, #f72585, #7209b7)'} : {}}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Job list */}
      <div className={`grid gap-4 transition-opacity ${fetching ? 'opacity-40' : 'opacity-100'}`}>
        {jobs
          .filter(job => 
            job.company.toLowerCase().includes(search.toLowerCase()) ||
            job.position.toLowerCase().includes(search.toLowerCase())
          )
          .map(job => (
          <div
            key={job.id}
            className="rounded-xl p-6 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderLeft: `4px solid ${STATUS_CHART_COLORS[job.status] || '#6b7280'}`,
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${STATUS_CHART_COLORS[job.status]}33`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => { setSelectedJob(job); fetchInterviews(job.id) }}
            >
              <div>
                <h2 className="text-xl font-semibold">{highlight(job.company, search)}</h2>
                <p className="text-gray-400">{highlight(job.position, search)}</p>
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
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

      {confirmDeleteInterviewId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col gap-4 w-72">
            <p className="text-white font-medium">Delete this interview record?</p>
            <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteInterviewId(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { handleDeleteInterview(selectedJob.id, confirmDeleteInterviewId); setConfirmDeleteInterviewId(null) }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

          {selectedJob && (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedJob(null)} />
        <div className="relative bg-gray-900 w-full max-w-lg h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-xl">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{selectedJob.company}</h2>
              <p className="text-gray-400">{selectedJob.position}</p>
            </div>
            <button onClick={() => setSelectedJob(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
          </div>

          {/* Job info */}
          <div className="rounded-xl p-4 flex flex-col gap-2 text-sm text-gray-400" style={{background: 'rgba(255,255,255,0.05)'}}>
            {editingId === selectedJob.id ? (
              <>
                <label className="text-gray-500 text-xs">Company</label>
                <input value={editData.company || ''} onChange={e => setEditData(prev => ({ ...prev, company: e.target.value }))} className="rounded-lg px-3 py-1 text-white outline-none" style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}} />
                <label className="text-gray-500 text-xs">Position</label>
                <input value={editData.position || ''} onChange={e => setEditData(prev => ({ ...prev, position: e.target.value }))} className="rounded-lg px-3 py-1 text-white outline-none" style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}} />
                <label className="text-gray-500 text-xs">Location</label>
                <input value={editData.location || ''} onChange={e => setEditData(prev => ({ ...prev, location: e.target.value }))} className="rounded-lg px-3 py-1 text-white outline-none" style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}} />
                <label className="text-gray-500 text-xs">Source URL</label>
                <input value={editData.source || ''} onChange={e => setEditData(prev => ({ ...prev, source: e.target.value }))} className="rounded-lg px-3 py-1 text-white outline-none" style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}} />
                <label className="text-gray-500 text-xs">Job Type</label>
                <input value={editData.job_type || ''} onChange={e => setEditData(prev => ({ ...prev, job_type: e.target.value }))} className="rounded-lg px-3 py-1 text-white outline-none" style={{background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)'}} />
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => { setEditingId(null); setEditData({}) }} className="px-3 py-1 text-gray-400 hover:text-white rounded-lg text-xs" style={{background: 'rgba(255,255,255,0.05)'}}>Cancel</button>
                  <button onClick={() => { handleSaveEdit(selectedJob.id); setSelectedJob(prev => ({ ...prev, ...editData })) }} className="px-3 py-1 text-white rounded-lg text-xs" style={{background: 'linear-gradient(90deg, #f72585, #7209b7)'}}>Save</button>
                </div>
              </>
            ) : (
              <>
                {selectedJob.location && <p>📍 {selectedJob.location}</p>}
                {selectedJob.source && <p>🔗 <a href={selectedJob.source} target="_blank" className="text-blue-400 hover:underline">{selectedJob.source}</a></p>}
                {selectedJob.job_type && <p>💼 {selectedJob.job_type}</p>}
                {selectedJob.deadline && <p>⏰ {selectedJob.deadline}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">Status:</span>
                  <select value={selectedJob.status} onChange={e => { handleUpdateStatus(selectedJob.id, e.target.value); setSelectedJob(prev => ({ ...prev, status: e.target.value })) }} className="rounded-lg px-2 py-1 text-white outline-none text-sm" style={{background: 'rgba(255,255,255,0.08)'}}>
                    {STATUSES.filter(s => s !== 'all').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => { setEditingId(selectedJob.id); setEditData({ company: selectedJob.company || '', position: selectedJob.position || '', location: selectedJob.location || '', source: selectedJob.source || '', job_type: selectedJob.job_type || '' }) }}
                    className="px-3 py-1 text-blue-400 rounded-lg text-xs"
                    style={{background: 'rgba(76,201,240,0.1)'}}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(selectedJob.id)}
                    className="px-3 py-1 text-red-400 rounded-lg text-xs"
                    style={{background: 'rgba(247,37,133,0.1)'}}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Interviews */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Interview Records</h3>
            {interviews.length === 0 && <p className="text-gray-500 text-sm">No interviews yet.</p>}
            {interviews.map(iv => (
              <div key={iv.id} className="bg-gray-800 rounded-xl p-4 mb-3 flex flex-col gap-2 text-sm">
                {editingInterviewId === iv.id ? (
                  <>
                    <div className="flex gap-2">
                      <div className="flex flex-col gap-1 w-20">
                        <label className="text-gray-500 text-xs">Round</label>
                        <input
                          type="number"
                          value={editInterviewData.round || ''}
                          onChange={e => setEditInterviewData(prev => ({ ...prev, round: e.target.value }))}
                          className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-28">
                        <label className="text-gray-500 text-xs">Type</label>
                        <input
                          value={editInterviewData.interview_type || ''}
                          onChange={e => setEditInterviewData(prev => ({ ...prev, interview_type: e.target.value }))}
                          className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1 w-36">
                        <label className="text-gray-500 text-xs">Date</label>
                        <input
                          type="date"
                          value={editInterviewData.date || ''}
                          onChange={e => setEditInterviewData(prev => ({ ...prev, date: e.target.value }))}
                          className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-gray-500 text-xs">Notes</label>
                      <textarea
                        value={editInterviewData.notes || ''}
                        onChange={e => setEditInterviewData(prev => ({ ...prev, notes: e.target.value }))}
                        className="bg-gray-700 rounded-lg px-3 py-2 text-white outline-none resize-none h-20"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setEditingInterviewId(null); setEditInterviewData({}) }}
                        className="px-3 py-1 bg-gray-700 text-gray-400 hover:bg-gray-600 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => { handleUpdateInterview(selectedJob.id, iv.id, { ...editInterviewData, round: parseInt(editInterviewData.round) }); setEditingInterviewId(null) }}
                        className="px-3 py-1 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-lg text-xs"
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Round {iv.round} {iv.interview_type && `· ${iv.interview_type}`}</p>
                    {iv.date && <p className="text-gray-400">📅 {iv.date}</p>}
                    {iv.notes && <p className="text-gray-400 mt-1">{iv.notes}</p>}
                    <div className="flex gap-2 justify-end mt-1">
                      <button
                        onClick={() => { setEditingInterviewId(iv.id); setEditInterviewData({ round: iv.round, interview_type: iv.interview_type || '', date: iv.date || '', notes: iv.notes || '' }) }}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteInterviewId(iv.id)}
                        className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add interview form */}
          <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
            <h4 className="font-medium text-sm">Add Interview</h4>
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 w-20">
                <label className="text-gray-500 text-xs">Round</label>
                <input
                  type="number"
                  value={newInterview.round}
                  onChange={e => setNewInterview(prev => ({ ...prev, round: e.target.value }))}
                  className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                />
              </div>
              <div className="flex flex-col gap-1 w-40">
                <label className="text-gray-500 text-xs">Type</label>
                <input
                  placeholder="Technical, HR..."
                  value={newInterview.interview_type}
                  onChange={e => setNewInterview(prev => ({ ...prev, interview_type: e.target.value }))}
                  className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none placeholder-gray-500"
                />
              </div>
              <div className="flex flex-col gap-1 w-40">
                <label className="text-gray-500 text-xs">Date</label>
                <input
                  type="date"
                  value={newInterview.date}
                  onChange={e => setNewInterview(prev => ({ ...prev, date: e.target.value }))}
                  className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-500 text-xs">Notes</label>
              <textarea
                placeholder="What was asked, how it went..."
                value={newInterview.notes}
                onChange={e => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                className="bg-gray-700 rounded-lg px-3 py-2 text-white outline-none placeholder-gray-500 resize-none h-20"
              />
            </div>
            <button
              onClick={() => handleAddInterview(selectedJob.id)}
              className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
            >
              Add
            </button>
          </div>

        </div>
      </div>
    )}
    </div>
  )
}

export default App
