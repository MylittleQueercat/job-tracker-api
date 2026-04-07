import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import TodayFocus from './components/TodayFocus'
import JobList from './components/JobList'
import JobDrawer from './components/JobDrawer'
import CatAssistant from './CatAssistant'
import { MOTIVATIONS } from './constants'

const API = 'https://job-tracker-8xwj.onrender.com'

export default function App() {
  // ── Job state ──────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

  // ── Add job form state ─────────────────────────────────────────────────────
  const [showForm, setShowForm] = useState(false)
  const [newJob, setNewJob] = useState({ company: '', position: '', status: 'applied', location: '', source: '', job_type: '' })
  const [submitting, setSubmitting] = useState(false)

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('token'))
  const username = token ? JSON.parse(atob(token.split('.')[1])).sub : null

  // ── UI state ───────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  const [darkMode, setDarkMode] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [isCelebrating, setIsCelebrating] = useState(false)
  const [motivation] = useState(MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)])
  const [dismissFollowUp, setDismissFollowUp] = useState(false)
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'fr')
  const [showUserMenu, setShowUserMenu] = useState(false)

  function switchLanguage(lang) {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  // ── Drawer / selected job state ────────────────────────────────────────────
  const [selectedJob, setSelectedJob] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // ── Interview state ────────────────────────────────────────────────────────
  const [interviews, setInterviews] = useState([])
  const [newInterview, setNewInterview] = useState({ round: 1, interview_type: '', date: '', notes: '' })
  const [editingInterviewId, setEditingInterviewId] = useState(null)
  const [editInterviewData, setEditInterviewData] = useState({})
  const [confirmDeleteInterviewId, setConfirmDeleteInterviewId] = useState(null)

  // Fetch jobs when filter or token changes
  useEffect(() => {
    if (!token) return
    setFetching(true)
    const url = filter === 'all' ? `${API}/jobs/` : `${API}/jobs/?status=${filter}`
    authFetch(url)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) { setError('Failed to load jobs'); return }
        setJobs(data); setLoading(false); setFetching(false)
      })
      .catch(err => { setError(err.message); setLoading(false); setFetching(false) })
  }, [filter, token])

  // ── Auth helpers ───────────────────────────────────────────────────────────

  // Wrapper around fetch that injects the auth token and handles 401 expiry
  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: { 'Authorization': token, ...options.headers }
    }).then(res => {
      if (res.status === 401) {
        localStorage.removeItem('token')
        setToken(null)
        throw new Error('Session expired, please login again')
      }
      return res
    })
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  // ── Toast helper ───────────────────────────────────────────────────────────
  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }

  // ── Confetti for offer ─────────────────────────────────────────────────────
  function celebrate() {
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#f72585', '#7209b7', '#4cc9f0', '#ffffff'] })
  }

  // ── JD parsing ─────────────────────────────────────────────────────────────
  async function handleParseJD(text) {
    try {
      const res = await authFetch(`${API}/api/parse-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.detail || 'Parsing failed')
        return null
      }
      showToast('✨ JD parsed!')
      return await res.json()
    } catch (err) {
      showToast('Parsing failed')
      return null
    }
  }

// ── Follow-up email generation ─────────────────────────────────────────────
  async function handleGenerateFollowUp(job, language = 'fr') {
    try {
      const res = await authFetch(`${API}/api/generate-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: job.company,
          position: job.position,
          created_at: job.created_at,
          language
        })
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.detail || 'Generation failed')
        return null
      }
      return await res.json()
    } catch (err) {
      showToast('Generation failed')
      return null
    }
  }

// ── Company brief generation ───────────────────────────────────────────────
  async function handleGenerateCompanyBrief(job) {
    try {
      console.log('generating brief with language:', language)
      const res = await authFetch(`${API}/api/company-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: job.id,
          company: job.company,
          position: job.position,
          language
        })
      })
      if (!res.ok) {
        const err = await res.json()
        showToast(err.detail || 'Generation failed')
        return null
      }
      const brief = await res.json()
      // Update the job in local state so brief persists without refetch
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, company_brief: JSON.stringify(brief) } : j))
      return brief
    } catch (err) {
      showToast('Generation failed')
      return null
    }
  }

  // ── Job CRUD ───────────────────────────────────────────────────────────────
  function handleAddJob() {
    setSubmitting(true)
    authFetch(`${API}/jobs/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    })
      .then(res => res.json())
      .then(data => {
        setJobs(prev => [data, ...prev])
        setNewJob({ company: '', position: '', status: 'applied', location: '', source: '', job_type: '' })
        setShowForm(false)
        setSubmitting(false)
        showToast('Job added!')
        setIsCelebrating(true)
        setTimeout(() => setIsCelebrating(false), 3000)
      })
      .catch(err => { setError(err.message); setSubmitting(false) })
  }

  function handleUpdateStatus(id, status) {
    authFetch(`${API}/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(updated => {
        if (!updated.id) return
        if (updated.status === 'offer') celebrate()
        setJobs(prev => prev.map(j => j.id === id ? updated : j))
      })
      .catch(err => setError(err.message))
  }

  function handleDeleteJob(id) {
    authFetch(`${API}/jobs/${id}`, { method: 'DELETE' })
      .then(() => {
        setJobs(prev => prev.filter(j => j.id !== id))
        setSelectedJob(null)
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

  // ── Interview CRUD ─────────────────────────────────────────────────────────
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
      body: JSON.stringify({ ...newInterview, round: parseInt(newInterview.round), date: newInterview.date || null })
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
    authFetch(`${API}/jobs/${jobId}/interviews/${interviewId}`, { method: 'DELETE' })
      .then(() => { setInterviews(prev => prev.filter(iv => iv.id !== interviewId)); showToast('Interview deleted!') })
      .catch(err => setError(err.message))
  }

  function handleUpdateInterview(jobId, interviewId, data) {
    authFetch(`${API}/jobs/${jobId}/interviews/${interviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(updated => { setInterviews(prev => prev.map(iv => iv.id === interviewId ? updated : iv)); showToast('Interview updated!') })
      .catch(err => setError(err.message))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  // Jobs that need follow-up: applied/interviewing and no update for 7+ days
  const followUpJobs = dismissFollowUp ? [] : jobs.filter(job => {
    if (!['applied', 'interviewing'].includes(job.status)) return false
    const daysSince = (Date.now() - new Date(job.created_at)) / (1000 * 60 * 60 * 24)
    return daysSince >= 7
  })
  if (!token) return <LoginForm onLogin={setToken} />
  if (loading) return <div className="p-8 text-white">Loading...</div>
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>

  return (
    <div className="min-h-screen p-8" style={{
      background: darkMode
        ? 'linear-gradient(135deg, #0f0f1a 0%, #1a0f2e 50%, #0f1a1a 100%)'
        : 'linear-gradient(135deg, #f8f9ff 0%, #f0e6ff 50%, #e6f9ff 100%)',
      color: darkMode ? 'white' : '#1a0f2e'
    }}>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🎯 Job Tracker</h1>
          <p className="text-base italic mt-1" style={{ color: '#4cc9f0' }}>
                      {motivation}
                    </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {['fr', 'en', 'zh'].map(lang => (
              <button
                key={lang}
                onClick={() => switchLanguage(lang)}
                className={`px-3 py-2 text-xs font-medium transition-all ${language === lang ? 'text-white' : 'text-gray-500 hover:text-white'}`}
                style={language === lang ? { background: 'linear-gradient(90deg, #f72585, #7209b7)' } : { background: 'rgba(255,255,255,0.05)' }}
              >
                {lang === 'fr' ? 'FR' : lang === 'en' ? 'EN' : '中'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setDarkMode(prev => !prev)}
            className="px-4 py-2 rounded-lg text-sm border border-white/10 hover:border-white/30"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            {darkMode ? '🌙' : '☀️'}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(prev => !prev)}
              className="px-4 py-2 text-gray-400 hover:text-white rounded-lg text-sm border border-white/10 hover:border-white/30 flex items-center gap-2"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#f72585] to-[#7209b7] flex items-center justify-center text-white text-xs font-bold shrink-0">
                ✦
              </div>
              <span className="text-sm text-gray-300">{username}</span>
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 z-20 rounded-xl border border-white/10 overflow-hidden"
                  style={{ background: '#0f0f1a' }}>
                  <button
                    onClick={() => { handleLogout(); setShowUserMenu(false) }}
                    className="w-full px-4 py-3 text-sm text-red-400 hover:bg-white/5 text-left"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up reminder banner */}
      {followUpJobs.length > 0 && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-3"
          style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
          <div className="flex items-center gap-3">
            <span>⏰</span>
            <span>
              <strong>{followUpJobs.length} job{followUpJobs.length > 1 ? 's' : ''}</strong> without news for 7+ days:&nbsp;
              {followUpJobs.slice(0, 3).map((j, i) => (
                <span key={j.id}>
                  <button
                    onClick={() => { setSelectedJob(j); fetchInterviews(j.id) }}
                    className="underline hover:opacity-70 transition-opacity"
                  >
                    {j.company}
                  </button>
                  {i < Math.min(followUpJobs.length, 3) - 1 ? ', ' : ''}
                </span>
              ))}
              {followUpJobs.length > 3 ? ` and ${followUpJobs.length - 3} more` : ''}
            </span>
          </div>
          <button
            onClick={() => setDismissFollowUp(true)}
            className="shrink-0 hover:opacity-70 transition-opacity text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dashboard stats */}
      <Dashboard jobs={jobs} />

      {/* Today's focus — priority actions */}
      <TodayFocus
        jobs={jobs}
        onSelectJob={setSelectedJob}
        fetchInterviews={fetchInterviews}
      />

      {/* Job list with search, filters and cards */}
      <JobList
        jobs={jobs} fetching={fetching}
        filter={filter} setFilter={setFilter}
        onSelectJob={job => { setSelectedJob(job); fetchInterviews(job.id) }}
        onUpdateStatus={handleUpdateStatus}
        onDeleteJob={handleDeleteJob}
        newJob={newJob} setNewJob={setNewJob}
        onAddJob={handleAddJob} submitting={submitting}
        showForm={showForm} setShowForm={setShowForm}
        onTyping={setIsTyping}
        onParseJD={handleParseJD}
      />

      {/* Footer */}
      <div className="h-64"></div>
      <div className="mt-auto border-t border-white/5 pt-12 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 opacity-20 hover:opacity-50 transition-all duration-700">
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Terminal Index</h3>
            <p className="text-[9px] font-medium uppercase tracking-widest text-gray-400">Nodes Synchronized — All Systems Nominal</p>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end text-gray-500 uppercase tracking-widest text-[10px]">
              <span>Integrity</span>
              <div className="flex gap-1 mt-1">
                <div className="w-3 h-0.5 rounded-full bg-white/40"></div>
                <div className="w-3 h-0.5 rounded-full bg-white/40"></div>
                <div className="w-3 h-0.5 rounded-full bg-white/10"></div>
              </div>
            </div>
            <div className="text-xl opacity-30 grayscale">🎯</div>
          </div>
        </div>
        <div className="mt-12 text-[8px] text-center text-white/5 uppercase tracking-[0.8em]">
          End of Transmission
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Delete job confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col gap-4 w-72">
            <p className="text-white font-medium">Delete this job?</p>
            <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded-lg text-sm">Cancel</button>
              <button onClick={() => { handleDeleteJob(confirmDeleteId); setConfirmDeleteId(null) }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete interview confirmation modal */}
      {confirmDeleteInterviewId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col gap-4 w-72">
            <p className="text-white font-medium">Delete this interview record?</p>
            <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeleteInterviewId(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-400 rounded-lg text-sm">Cancel</button>
              <button onClick={() => { handleDeleteInterview(selectedJob.id, confirmDeleteInterviewId); setConfirmDeleteInterviewId(null) }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Side drawer with job details and interview records */}
      <JobDrawer
        selectedJob={selectedJob} setSelectedJob={setSelectedJob}
        interviews={interviews} newInterview={newInterview} setNewInterview={setNewInterview}
        editingId={editingId} setEditingId={setEditingId}
        editData={editData} setEditData={setEditData}
        editingInterviewId={editingInterviewId} setEditingInterviewId={setEditingInterviewId}
        editInterviewData={editInterviewData} setEditInterviewData={setEditInterviewData}
        confirmDeleteInterviewId={confirmDeleteInterviewId} setConfirmDeleteInterviewId={setConfirmDeleteInterviewId}
        confirmDeleteId={confirmDeleteId} setConfirmDeleteId={setConfirmDeleteId}
        onUpdateStatus={handleUpdateStatus} onSaveEdit={handleSaveEdit} onDeleteJob={handleDeleteJob}
        onAddInterview={handleAddInterview} onUpdateInterview={handleUpdateInterview} onDeleteInterview={handleDeleteInterview}
        onGenerateFollowUp={(job, lang) => handleGenerateFollowUp(job, lang || language)}
        onGenerateCompanyBrief={handleGenerateCompanyBrief}
      />

      {/* Cat assistant — reacts to typing and job celebrations */}
      <CatAssistant isTyping={isTyping} isCelebrating={isCelebrating} />
    </div>
  )
}
