import { useState, useRef } from 'react'
import { STATUSES, STATUS_CHART_COLORS } from '../constants'

// Highlights matching text in search results
function highlight(text, query) {
  if (!query) return text
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background: 'linear-gradient(90deg, #f72585, #7209b7)', color: 'white', borderRadius: '3px', padding: '0 2px' }}>{part}</mark>
      : part
  )
}

// Job list with search bar, status filters, and job cards
export default function JobList({
  jobs, fetching, filter, setFilter,
  onSelectJob, onUpdateStatus, onDeleteJob,
  newJob, setNewJob, onAddJob, submitting,
  showForm, setShowForm, onTyping
}) {
  const [search, setSearch] = useState('')
  const [activeStatusPicker, setActiveStatusPicker] = useState(null)
  const typingTimeoutRef = useRef(null)

  function handleSearch(e) {
    setSearch(e.target.value)
    onTyping(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000)
  }

  const filteredJobs = jobs.filter(job =>
    job.company.toLowerCase().includes(search.toLowerCase()) ||
    job.position.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Add Job button */}
      <button
        onClick={() => setShowForm(prev => !prev)}
        className="mb-6 px-4 py-2 rounded-lg text-sm font-bold text-white"
        style={{ background: 'linear-gradient(90deg, #f72585, #7209b7)' }}
      >
        {showForm ? '✕ Cancel' : '+ Add Job'}
      </button>

      {/* Add Job form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-9 flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              placeholder="Company *"
              value={newJob.company}
              onChange={e => setNewJob(prev => ({ ...prev, company: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input
              placeholder="Position *"
              value={newJob.position}
              onChange={e => setNewJob(prev => ({ ...prev, position: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div className="flex gap-3">
            <input
              placeholder="Location"
              value={newJob.location}
              onChange={e => setNewJob(prev => ({ ...prev, location: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <input
              placeholder="Source (LinkedIn, Indeed...)"
              value={newJob.source}
              onChange={e => setNewJob(prev => ({ ...prev, source: e.target.value }))}
              className="flex-1 rounded-lg px-4 py-2 text-white placeholder-gray-500 outline-none"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
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
              onClick={onAddJob}
              disabled={submitting || !newJob.company || !newJob.position}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-sm font-medium"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="relative group max-w-2xl mx-auto mb-12">
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none z-10">
          <span className="text-[#4cc9f0] font-mono text-xs opacity-40 group-focus-within:opacity-100 transition-opacity">$</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 group-focus-within:text-[#4cc9f0] transition-all">QUERY /</span>
        </div>
        <input
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="SEARCH DATABASE..."
          className="w-full bg-white/[0.06] border border-white/10 rounded-2xl pl-28 pr-20 py-4 text-sm font-medium tracking-wide text-white
                    focus:outline-none focus:bg-white/[0.09] focus:border-[#4cc9f0]/50 focus:ring-4 focus:ring-[#4cc9f0]/5
                    transition-all duration-300
                    placeholder:text-gray-700 placeholder:tracking-[0.2em] placeholder:text-[9px]"
        />
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
          <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${search ? 'text-[#4cc9f0]' : 'text-gray-700'}`}>
            {search ? 'ACTIVE' : 'IDLE'}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${search ? 'bg-[#4cc9f0] shadow-[0_0_10px_#4cc9f0] animate-pulse' : 'bg-white/10'}`}></div>
        </div>
      </div>

      {/* Status filter buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${filter === s ? 'text-white border-transparent' : 'text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
            style={filter === s ? { background: 'linear-gradient(90deg, #f72585, #7209b7)' } : {}}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Job cards */}
      <div className={`grid gap-4 transition-opacity ${fetching ? 'opacity-40' : 'opacity-100'}`}>
        {filteredJobs.map(job => (
          <div
            key={job.id}
            className={`rounded-xl p-6 cursor-pointer relative ${activeStatusPicker === job.id ? 'z-50' : 'z-0'}`}
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderLeft: `4px solid ${STATUS_CHART_COLORS[job.status] || '#6b7280'}`,
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${STATUS_CHART_COLORS[job.status]}33`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            {/* Card header — click to open drawer */}
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => onSelectJob(job)}
            >
              <div>
                <h2 className="text-xl font-semibold">{highlight(job.company, search)}</h2>
                <p className="text-gray-400">{highlight(job.position, search)}</p>
              </div>

              {/* Status picker button */}
              <div className={`relative ${activeStatusPicker === job.id ? 'z-100' : 'z-10'}`}>
                <button
                  onClick={e => { e.stopPropagation(); setActiveStatusPicker(activeStatusPicker === job.id ? null : job.id) }}
                  className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 hover:brightness-125"
                  style={{
                    backgroundColor: STATUS_CHART_COLORS[job.status] + '10',
                    color: STATUS_CHART_COLORS[job.status],
                    borderColor: STATUS_CHART_COLORS[job.status] + '30'
                  }}
                >
                  {job.status.replace('_', ' ')}
                </button>

                {/* Status dropdown */}
                {activeStatusPicker === job.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setActiveStatusPicker(null) }} />
                    <div
                      className="absolute right-0 mt-2 p-1.5 flex flex-col gap-0.5 z-20 min-w-[200px] rounded-2xl border border-white/10 bg-[#0f0f1a]/95 backdrop-blur-2xl shadow-2xl"
                      onClick={e => e.stopPropagation()}
                    >
                      {STATUSES.filter(s => s !== 'all').map(s => (
                        <button
                          key={s}
                          onClick={() => { onUpdateStatus(job.id, s); setActiveStatusPicker(null) }}
                          className={`flex items-center justify-start gap-3 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-tight transition-all whitespace-nowrap
                            ${job.status === s ? 'bg-white/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/80'}`}
                        >
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CHART_COLORS[s] }} />
                          <span className="opacity-90">{s.replace('_', ' ')}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredJobs.length === 0 && !fetching && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-7xl">🚀</div>
            <h3 className="text-xl font-bold text-white">Your journey starts here!</h3>
            <p className="text-gray-500 text-sm text-center">Add your first application and start tracking<br />your path to the perfect job.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(90deg, #f72585, #7209b7)' }}
            >
              + Add your first job
            </button>
          </div>
        )}
      </div>
    </>
  )
}