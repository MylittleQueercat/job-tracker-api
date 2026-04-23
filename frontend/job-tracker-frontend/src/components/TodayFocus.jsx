import { STATUS_LABELS } from '../constants'

// TodayFocus component — shows the 3 most important actions for today
export default function TodayFocus({ jobs, onSelectJob, fetchInterviews }) {
  const now = Date.now()

  // 🔴 Action needed: deadline in 3 days, or technical_test/interview with no interviews recorded
  const actionNeeded = jobs.filter(job => {
    if (job.deadline) {
      const daysUntil = (new Date(job.deadline) - now) / (1000 * 60 * 60 * 24)
      if (daysUntil <= 3 && daysUntil >= 0) return true
    }
    if (['technical_test', 'interview', 'final_interview'].includes(job.status)) {
      return true
    }
    return false
  }).slice(0, 3)

// Thresholds based on French job market rhythm
	const FOLLOWUP_THRESHOLDS = {
		applied: 14,
		phone_screen: 7,
		technical_test: 5,
		interview: 7,
		final_interview: 5,
		no_response: 14,
	}

  // 🟡 Follow up: based on status-specific thresholds
  const followUp = jobs.filter(job => {
    const threshold = FOLLOWUP_THRESHOLDS[job.status]
    if (!threshold) return false
    const daysSince = (now - new Date(job.updated_at || job.created_at)) / (1000 * 60 * 60 * 24)
    return daysSince >= threshold
  }).slice(0, 3)

  // 📅 Upcoming interviews: interviews with a future date within 7 days
  const upcomingInterviews = []
  jobs.forEach(job => {
    if (job.interviews && job.interviews.length > 0) {
      job.interviews.forEach(iv => {
        if (!iv.date) return
        const interviewDate = new Date(iv.date)
        const daysUntil = (interviewDate - now) / (1000 * 60 * 60 * 24)
        if (daysUntil >= -1 && daysUntil <= 7) {
          upcomingInterviews.push({ ...iv, job })
        }
      })
    }
  })
  upcomingInterviews.sort((a, b) => new Date(a.date) - new Date(b.date))

  // 💀 Dead zone: no activity for 45+ days (except offer/rejected)
  const deadZone = jobs.filter(job => {
    if (['offer', 'rejected'].includes(job.status)) return false
    const daysSince = (now - new Date(job.updated_at || job.created_at)) / (1000 * 60 * 60 * 24)
    return daysSince >= 45
  }).slice(0, 2)

  // 🔵 This week: no new applications this week
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const appliedThisWeek = jobs.filter(job => new Date(job.created_at) >= startOfWeek).length
  const noActivityThisWeek = appliedThisWeek === 0

  const totalItems = actionNeeded.length + followUp.length + upcomingInterviews.length + deadZone.length + (noActivityThisWeek ? 1 : 0)
  if (totalItems === 0) return (
    <div className="rounded-2xl p-6 mb-8 flex items-center gap-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]"></div>
      <p className="text-sm text-gray-400">All clear — no actions needed today.</p>
    </div>
  )

  return (
    <div className="rounded-2xl p-6 mb-8"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-white/30 mb-1">
            Today's Focus / <span className="text-white/60">Actions</span>
          </h2>
          <p className="text-sm text-gray-500">{totalItems} thing{totalItems > 1 ? 's' : ''} need your attention</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02]">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></div>
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Live</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">

        {/* 🔴 Action needed */}
        {actionNeeded.map(job => {
          const daysUntil = job.deadline
            ? Math.ceil((new Date(job.deadline) - now) / (1000 * 60 * 60 * 24))
            : null
          return (
            <button
              key={job.id}
              onClick={() => { onSelectJob(job); fetchInterviews(job.id) }}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:bg-white/[0.04] group"
              style={{ border: '1px solid rgba(247,37,133,0.2)', background: 'rgba(247,37,133,0.05)' }}
            >
              <div className="w-2 h-2 rounded-full bg-[#f72585] shadow-[0_0_8px_#f72585] shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{job.company}</p>
                <p className="text-xs text-gray-500 truncate">{job.position}</p>
              </div>
              <div className="shrink-0 text-right">
                {daysUntil !== null ? (
                  <p className="text-xs font-bold text-[#f72585]">
                    {daysUntil === 0 ? 'Due today' : `Due in ${daysUntil}d`}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-[#f72585] uppercase tracking-wide">{STATUS_LABELS[job.status] || job.status.replace('_', ' ')}</p>
                )}
              </div>
            </button>
          )
        })}

        {/* 📅 Upcoming interviews */}
        {upcomingInterviews.map(iv => {
          const interviewDate = new Date(iv.date)
          const daysUntil = Math.ceil((interviewDate - now) / (1000 * 60 * 60 * 24))
          return (
            <button
              key={iv.id}
              onClick={() => { onSelectJob(iv.job); fetchInterviews(iv.job.id) }}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:bg-white/[0.04]"
              style={{
                border: `1px solid ${daysUntil <= 1 ? 'rgba(247,37,133,0.3)' : 'rgba(124,58,237,0.3)'}`,
                background: `${daysUntil <= 1 ? 'rgba(247,37,133,0.05)' : 'rgba(124,58,237,0.05)'}`
              }}
            >
              <div className="w-2 h-2 rounded-full shrink-0"
                style={{ background: daysUntil <= 1 ? '#f72585' : '#7c3aed', boxShadow: `0 0 8px ${daysUntil <= 1 ? '#f72585' : '#7c3aed'}` }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{iv.job.company}</p>
                <p className="text-xs text-gray-500 truncate">
                  {iv.interview_type || 'Interview'} {iv.round ? `· Round ${iv.round}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-bold" style={{ color: daysUntil <= 1 ? '#f72585' : '#a78bfa' }}>
                  {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                </p>
                <p className="text-xs text-gray-600">
                  {interviewDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </button>
          )
        })}

        {/* 🟡 Follow up */}
        {followUp.map(job => {
          const daysSince = Math.floor((now - new Date(job.created_at)) / (1000 * 60 * 60 * 24))
          return (
            <button
              key={job.id}
              onClick={() => { onSelectJob(job); fetchInterviews(job.id) }}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:bg-white/[0.04]"
              style={{ border: '1px solid rgba(251,191,36,0.2)', background: 'rgba(251,191,36,0.05)' }}
            >
              <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#fbbf24] shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{job.company}</p>
                <p className="text-xs text-gray-500 truncate">{job.position}</p>
              </div>
              <p className="text-xs font-bold text-yellow-400 shrink-0">
                {daysSince}d — follow up?
              </p>
            </button>
          )
        })}

		{/* 💀 Dead zone */}
        {deadZone.map(job => {
          const daysSince = Math.floor((now - new Date(job.created_at)) / (1000 * 60 * 60 * 24))
          return (
            <button
              key={job.id}
              onClick={() => { onSelectJob(job); fetchInterviews(job.id) }}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:bg-white/[0.04]"
              style={{ border: '1px solid rgba(107,114,128,0.3)', background: 'rgba(107,114,128,0.05)' }}
            >
              <div className="w-2 h-2 rounded-full bg-gray-500 shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-400 truncate">{job.company}</p>
                <p className="text-xs text-gray-600 truncate">{job.position}</p>
              </div>
              <p className="text-xs font-bold text-gray-500 shrink-0">{daysSince}d — confirm status?</p>
            </button>
          )
        })}

        {/* 🔵 No activity this week */}
        {noActivityThisWeek && (
          <div
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ border: '1px solid rgba(76,201,240,0.2)', background: 'rgba(76,201,240,0.05)' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#4cc9f0] shadow-[0_0_8px_#4cc9f0] shrink-0"></div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">No applications this week</p>
              <p className="text-xs text-gray-500">Keep the momentum — add at least one new job today</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}