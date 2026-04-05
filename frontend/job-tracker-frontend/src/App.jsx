import { useState, useEffect } from 'react'

const API = 'https://job-tracker-8xwj.onrender.com'
const TOKEN = import.meta.env.VITE_API_TOKEN

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
  const [newJob, setNewJob] = useState({ company: '', position: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setFetching(true)
    const url = filter === 'all' ? `${API}/jobs/` : `${API}/jobs/?status=${filter}`
    fetch(url, { headers: { 'Authorization': TOKEN } })
      .then(res => res.json())
      .then(data => { setJobs(data); setLoading(false); setFetching(false) })
      .catch(err => { setError(err.message); setLoading(false); setFetching(false) })
  }, [filter])

  function handleAddJob() {
    setSubmitting(true)
    fetch(`${API}/jobs/`, {
      method: 'POST',
      headers: { 'Authorization': TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    })
      .then(res => res.json())
      .then(data => {
        setJobs(prev => [data, ...prev])  // 新job插到列表最前面
        setNewJob({ company: '', position: '' })
        setShowForm(false)
        setSubmitting(false)
      })
      .catch(err => { setError(err.message); setSubmitting(false) })
  }

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
        <div className="bg-gray-800 rounded-xl p-6 mb-8 flex gap-4">
          <input
            placeholder="Company"
            value={newJob.company}
            onChange={e => setNewJob(prev => ({ ...prev, company: e.target.value }))}
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
          />
          <input
            placeholder="Position"
            value={newJob.position}
            onChange={e => setNewJob(prev => ({ ...prev, position: e.target.value }))}
            className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
          />
          <button
            onClick={handleAddJob}
            disabled={submitting || !newJob.company || !newJob.position}
            className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
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
          <div key={job.id} className="bg-gray-800 rounded-xl p-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{job.company}</h2>
              <p className="text-gray-400">{job.position}</p>
              {job.location && <p className="text-gray-500 text-sm">{job.location}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[job.status] || 'bg-gray-500/20 text-gray-400'}`}>
              {job.status}
            </span>
          </div>
        ))}
      {jobs.length === 0 && !fetching && <p className="text-gray-500">No jobs found.</p>}
      </div>
    </div>
  )
}

export default App
