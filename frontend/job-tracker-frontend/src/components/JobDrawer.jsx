import { useState } from 'react'
import { STATUSES } from '../constants'

// Side drawer showing full job details and interview records
export default function JobDrawer({
  selectedJob, setSelectedJob,
  interviews, newInterview, setNewInterview,
  editingId, setEditingId, editData, setEditData,
  editingInterviewId, setEditingInterviewId,
  editInterviewData, setEditInterviewData,
  confirmDeleteInterviewId, setConfirmDeleteInterviewId,
  onUpdateStatus, onSaveEdit, onDeleteJob,
  onAddInterview, onUpdateInterview, onDeleteInterview,
  confirmDeleteId, setConfirmDeleteId
}) {
  if (!selectedJob) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedJob(null)} />

      <div className="relative bg-gray-900 w-full max-w-lg h-full overflow-y-auto p-6 flex flex-col gap-6 shadow-xl">

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
              {selectedJob.source && <p>🔗 <a href={selectedJob.source} target="_blank" className="text-blue-400 hover:underline">{selectedJob.source}</a></p>}
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

        {/* Interview records list */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Interview Records</h3>
          {interviews.length === 0 && <p className="text-gray-500 text-sm">No interviews yet.</p>}
          {interviews.map(iv => (
            <div key={iv.id} className="bg-gray-800 rounded-xl p-4 mb-3 flex flex-col gap-2 text-sm">
              {editingInterviewId === iv.id ? (
                <>
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
                </>
              ) : (
                <>
                  {/* Interview view */}
                  <p className="font-medium">Round {iv.round} {iv.interview_type && `· ${iv.interview_type}`}</p>
                  {iv.date && <p className="text-gray-400">📅 {iv.date}</p>}
                  {iv.notes && <p className="text-gray-400 mt-1">{iv.notes}</p>}
                  <div className="flex gap-2 justify-end mt-1">
                    <button onClick={() => { setEditingInterviewId(iv.id); setEditInterviewData({ round: iv.round, interview_type: iv.interview_type || '', date: iv.date || '', notes: iv.notes || '' }) }} className="px-3 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg text-xs">Edit</button>
                    <button onClick={() => setConfirmDeleteInterviewId(iv.id)} className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 rounded-lg text-xs">Delete</button>
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