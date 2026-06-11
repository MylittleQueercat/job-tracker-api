import { useState } from 'react'
import { STATUSES } from '../constants'

// Side drawer showing full job details and interview records
export default function JobDrawer({
  selectedJob, setSelectedJob,
  interviews, newInterview, setNewInterview,
  editingId, setEditingId, editData, setEditData,
  editingInterviewId, setEditingInterviewId,
  editInterviewData, setEditInterviewData,
  setConfirmDeleteInterviewId,
  onUpdateStatus, onSaveEdit,
  onAddInterview, onUpdateInterview,
  setConfirmDeleteId,
  onGenerateFollowUp,
  onGenerateCompanyBrief,
  onShowToast,
  onAnalyzeMatch,
}) {
  const [followUpEmail, setFollowUpEmail] = useState(null)
  const [followUpEmailExpanded, setFollowUpEmailExpanded] = useState(false)
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [companyBrief, setCompanyBrief] = useState(
    selectedJob?.company_brief ? JSON.parse(selectedJob.company_brief) : null
  )
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [companyBriefExpanded, setCompanyBriefExpanded] = useState(false)
  const [expandedInterviewId, setExpandedInterviewId] = useState(null)
  const [matchScore, setMatchScore] = useState(
    selectedJob?.match_score ? JSON.parse(selectedJob.match_score) : null
  )
  const [matchScoreExpanded, setMatchScoreExpanded] = useState(false)
  const [analyzingMatch, setAnalyzingMatch] = useState(false)

  if (!selectedJob) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/60 animate-fade-in" onClick={() => setSelectedJob(null)} />

      <div className="relative bg-gray-900 w-full max-w-lg h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-xl animate-slide-in">

        {/* Drawer header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{selectedJob.company}</h2>
            <p className="text-gray-400">{selectedJob.position}</p>
          </div>
          <button onClick={() => setSelectedJob(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        {/* Job info — view or edit mode */}
        <div className="rounded-xl p-4 flex flex-col gap-2 text-sm text-gray-400" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {editingId === selectedJob.id ? (
            <>
              {/* Edit mode */}
              {['company', 'position', 'location', 'source', 'job_type'].map(field => (
                <div key={field}>
                  <label className="text-gray-500 text-xs capitalize">{field.replace('_', ' ')}</label>
                  <input
                    value={editData[field] || ''}
                    onChange={e => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full rounded-lg px-3 py-1 text-white outline-none mt-1"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              ))}
              <div className="flex gap-2 justify-end mt-2">
                <button onClick={() => { setEditingId(null); setEditData({}) }}
                  className="px-3 py-1 text-gray-400 hover:text-white rounded-lg text-xs"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</button>
                <button onClick={() => { onSaveEdit(selectedJob.id); setSelectedJob(prev => ({ ...prev, ...editData })) }}
                  className="px-3 py-1 text-white rounded-lg text-xs"
                  style={{ background: 'linear-gradient(90deg, #f72585, #7209b7)' }}>Save</button>
              </div>
            </>
          ) : (
            <>
              {/* View mode */}
              {selectedJob.location && <p>📍 {selectedJob.location}</p>}
              {selectedJob.source && <p className="break-all">🔗 <a href={selectedJob.source} target="_blank" className="text-blue-400 hover:underline">{selectedJob.source}</a></p>}
              {selectedJob.job_type && <p>💼 {selectedJob.job_type}</p>}
              {selectedJob.deadline && <p>⏰ {selectedJob.deadline}</p>}

              {/* Status selector */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">Status:</span>
                <select
                  value={selectedJob.status}
                  onChange={e => { onUpdateStatus(selectedJob.id, e.target.value); setSelectedJob(prev => ({ ...prev, status: e.target.value })) }}
                  className="rounded-lg px-2 py-1 text-white outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  {STATUSES.filter(s => s !== 'all').map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => { setEditingId(selectedJob.id); setEditData({ company: selectedJob.company || '', position: selectedJob.position || '', location: selectedJob.location || '', source: selectedJob.source || '', job_type: selectedJob.job_type || '' }) }}
                  className="px-3 py-1 text-blue-400 rounded-lg text-xs"
                  style={{ background: 'rgba(76,201,240,0.1)' }}>Edit</button>
                <button
                  onClick={() => setConfirmDeleteId(selectedJob.id)}
                  className="px-3 py-1 text-red-400 rounded-lg text-xs"
                  style={{ background: 'rgba(247,37,133,0.1)' }}>Delete</button>
              </div>
            </>
          )}
        </div>

		{/* Follow-up email generator */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setFollowUpEmailExpanded(prev => !prev)}
              className="text-sm font-semibold hover:opacity-70 transition-opacity flex items-center gap-2"
            >
              Follow-up Email
              <span className="text-gray-400 text-2xl font-light">{followUpEmailExpanded ? '−' : '+'}</span>
            </button>
            <button
              onClick={async () => {
                setGeneratingEmail(true)
                const lang = followUpEmail?.language || 'fr'
                const result = await onGenerateFollowUp(selectedJob, lang)
                if (result) {
                  setFollowUpEmail({ ...result, language: lang })
                  setFollowUpEmailExpanded(true)
                  setSelectedJob(prev => ({ ...prev, followup_email: JSON.stringify({ ...result, language: lang }) }))
                }
                setGeneratingEmail(false)
              }}
              disabled={generatingEmail}
              className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(90deg, #f72585, #7209b7)' }}
            >
              {generatingEmail ? '⏳ Generating...' : followUpEmail ? 'Regenerate' : 'Generate'}
            </button>
          </div>

          {followUpEmail && followUpEmailExpanded && (
            <div className="flex flex-col gap-3">
              {/* Subject */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Subject</p>
                <p className="text-sm text-white bg-gray-800 rounded-lg px-3 py-2">{followUpEmail.subject}</p>
              </div>
              {/* Body */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Body</p>
                <p className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-2 whitespace-pre-line">{followUpEmail.body}</p>
              </div>
              {/* Actions */}
              <div className="flex gap-2 justify-end">
                {/* Switch language */}
                <button
                  onClick={async () => {
                    const newLang = followUpEmail.language === 'fr' ? 'en' : 'fr'
                    setGeneratingEmail(true)
                    const result = await onGenerateFollowUp(selectedJob, newLang)
                    if (result) {
                      setFollowUpEmail({ ...result, language: newLang })
                      setFollowUpEmailExpanded(true)
                      setSelectedJob(prev => ({ ...prev, followup_email: JSON.stringify({ ...result, language: newLang }) }))
                    }
                    setGeneratingEmail(false)
                  }}
                  disabled={generatingEmail}
                  className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  {followUpEmail.language === 'fr' ? '🇬🇧 Switch to English' : '🇫🇷 Switch to French'}
                </button>
                {/* Copy */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Subject: ${followUpEmail.subject}\n\n${followUpEmail.body}`)
                    onShowToast('Copied!')
                  }}
                  className="px-3 py-1 rounded-lg text-xs text-white"
                  style={{ background: 'rgba(76,201,240,0.15)', color: '#4cc9f0' }}
                >
                  📋 Copy
                </button>
              </div>
            </div>
          )}
        </div>

		{/* Company brief */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCompanyBriefExpanded(prev => !prev)}
              className="text-sm font-semibold hover:opacity-70 transition-opacity flex items-center gap-2"
            >
              Company Brief
              <span className="text-gray-400 text-2xl font-light">{companyBriefExpanded ? '−' : '+'}</span>
            </button>
            <button
              onClick={async () => {
                setGeneratingBrief(true)
                const result = await onGenerateCompanyBrief(selectedJob)
                if (result) { setCompanyBrief(result); setCompanyBriefExpanded(true) }
                setGeneratingBrief(false)
              }}
              disabled={generatingBrief}
              className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(90deg, #f72585, #7209b7)' }}
            >
              {generatingBrief ? 'Generating...' : companyBrief ? 'Regenerate' : 'Generate'}
            </button>
          </div>

          {companyBriefExpanded && companyBrief && (
            <div className="flex flex-col gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-1">What they do</p>
                <p className="text-gray-300">{companyBrief.what_they_do}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Company stage</p>
                <p className="text-gray-300">{companyBrief.company_stage}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Likely technical topics</p>
                <ul className="flex flex-col gap-1">
                  {companyBrief.likely_technical_topics.split(' | ').map((t, i) => (
                    <li key={i} className="text-gray-300">— {t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Question to ask</p>
                <p className="text-gray-300">{companyBrief.question_to_ask}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Market position</p>
                <p className="text-gray-300">{companyBrief.market_position}</p>
              </div>
            </div>
          )}
        </div>

        {/* Match Score */}
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setMatchScoreExpanded(prev => !prev)}
              className="text-sm font-semibold hover:opacity-70 transition-opacity flex items-center gap-2"
            >
              Match Score
              <span className="text-gray-400 text-2xl font-light">{matchScoreExpanded ? '−' : '+'}</span>
            </button>
            <button
              onClick={async () => {
                setAnalyzingMatch(true)
                const result = await onAnalyzeMatch(selectedJob)
                if (result) {
                  setMatchScore(result)
                  setMatchScoreExpanded(true)
                  setSelectedJob(prev => ({ ...prev, match_score: JSON.stringify(result) }))
                }
                setAnalyzingMatch(false)
              }}
              disabled={analyzingMatch}
              className="px-3 py-1 rounded-lg text-xs font-bold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(90deg, #f72585, #7209b7)' }}
            >
              {analyzingMatch ? 'Analyzing...' : matchScore ? 'Re-analyze' : 'Analyze'}
            </button>
          </div>

          {analyzingMatch && (
            <p className="text-sm text-gray-400 animate-pulse">Analyzing your resume against this job…</p>
          )}

          {matchScore && matchScoreExpanded && !analyzingMatch && (() => {
            const s = matchScore.score
            const scoreColor = s >= 70 ? '#4ade80' : s >= 50 ? '#fbbf24' : '#f87171'
            return (
              <div className="flex flex-col gap-4 text-sm">
                {/* Score */}
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-black" style={{ color: scoreColor }}>{s}</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Match score</span>
                    <div className="w-32 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${s}%`, background: scoreColor }} />
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Strengths</p>
                  <ul className="flex flex-col gap-1">
                    {matchScore.strengths.map((item, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-2">
                        <span style={{ color: '#4ade80' }}>✓</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Gaps</p>
                  <ul className="flex flex-col gap-1">
                    {matchScore.weaknesses.map((item, i) => (
                      <li key={i} className="text-gray-300 flex items-start gap-2">
                        <span style={{ color: '#f87171' }}>✗</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ATS keywords missing */}
                {matchScore.ats_keywords_missing?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1.5">ATS keywords missing</p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchScore.ats_keywords_missing.map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full text-xs"
                          style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation */}
                <div className="rounded-lg px-3 py-2.5 text-xs text-gray-300 leading-relaxed"
                  style={{ background: 'rgba(114,9,183,0.12)', border: '1px solid rgba(114,9,183,0.25)' }}>
                  {matchScore.recommendation}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Interview records list */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Interview Records</h3>
          {interviews.length === 0 && <p className="text-gray-500 text-sm">No interviews yet.</p>}
          {interviews.map(iv => (
            <div key={iv.id} className="bg-gray-800 rounded-xl mb-3 text-sm overflow-hidden">
              {editingInterviewId === iv.id ? (
                <div className="p-4 flex flex-col gap-2">
                  {/* Interview edit form */}
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1 w-20">
                      <label className="text-gray-500 text-xs">Round</label>
                      <input type="number" value={editInterviewData.round || ''} onChange={e => setEditInterviewData(prev => ({ ...prev, round: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none" />
                    </div>
                    <div className="flex flex-col gap-1 w-28">
                      <label className="text-gray-500 text-xs">Type</label>
                      <input value={editInterviewData.interview_type || ''} onChange={e => setEditInterviewData(prev => ({ ...prev, interview_type: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none" />
                    </div>
                    <div className="flex flex-col gap-1 w-36">
                      <label className="text-gray-500 text-xs">Date</label>
                      <input type="date" value={editInterviewData.date || ''} onChange={e => setEditInterviewData(prev => ({ ...prev, date: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-gray-500 text-xs">Notes</label>
                    <textarea value={editInterviewData.notes || ''} onChange={e => setEditInterviewData(prev => ({ ...prev, notes: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-2 text-white outline-none resize-none h-20" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditingInterviewId(null); setEditInterviewData({}) }} className="px-3 py-1 bg-gray-700 text-gray-400 hover:bg-gray-600 rounded-lg text-xs">Cancel</button>
                    <button onClick={() => { onUpdateInterview(selectedJob.id, iv.id, { ...editInterviewData, round: parseInt(editInterviewData.round) }); setEditingInterviewId(null) }} className="px-3 py-1 bg-green-600/20 text-green-400 hover:bg-green-600/40 rounded-lg text-xs">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Collapsed header — always visible */}
                  <button
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                    onClick={() => setExpandedInterviewId(prev => prev === iv.id ? null : iv.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Round {iv.round}{iv.interview_type && ` · ${iv.interview_type}`}</span>
                      {iv.date && <span className="text-gray-500 text-xs">📅 {iv.date}</span>}
                    </div>
                    <span className="text-gray-500 text-lg font-light">{expandedInterviewId === iv.id ? '−' : '+'}</span>
                  </button>

                  {/* Expanded content */}
                  {expandedInterviewId === iv.id && (
                    <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/5">
                      {iv.notes
                        ? <p className="text-gray-400 mt-2 break-all whitespace-pre-wrap">{iv.notes}</p>
                        : <p className="text-gray-600 mt-2 text-xs italic">No notes.</p>
                      }
                      <div className="flex gap-2 justify-end mt-1">
                        <button onClick={() => { setEditingInterviewId(iv.id); setEditInterviewData({ round: iv.round, interview_type: iv.interview_type || '', date: iv.date || '', notes: iv.notes || '' }) }} className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg text-xs">Edit</button>
                        <button onClick={() => setConfirmDeleteInterviewId(iv.id)} className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-xs">Delete</button>
                      </div>
                    </div>
                  )}
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
              <input type="number" value={newInterview.round} onChange={e => setNewInterview(prev => ({ ...prev, round: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none" />
            </div>
            <div className="flex flex-col gap-1 w-40">
              <label className="text-gray-500 text-xs">Type</label>
              <input placeholder="Technical, HR..." value={newInterview.interview_type} onChange={e => setNewInterview(prev => ({ ...prev, interview_type: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none placeholder-gray-500" />
            </div>
            <div className="flex flex-col gap-1 w-40">
              <label className="text-gray-500 text-xs">Date</label>
              <input type="date" value={newInterview.date} onChange={e => setNewInterview(prev => ({ ...prev, date: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-1 text-white outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-gray-500 text-xs">Notes</label>
            <textarea placeholder="What was asked, how it went..." value={newInterview.notes} onChange={e => setNewInterview(prev => ({ ...prev, notes: e.target.value }))} className="bg-gray-700 rounded-lg px-3 py-2 text-white outline-none placeholder-gray-500 resize-none h-20" />
          </div>
          <button onClick={() => onAddInterview(selectedJob.id)} className="self-end px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">Add</button>
        </div>

      </div>
    </div>
  )
}
