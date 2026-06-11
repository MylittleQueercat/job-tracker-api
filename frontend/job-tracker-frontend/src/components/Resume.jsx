import { useState, useEffect, useRef, useCallback } from 'react'

const API = 'https://job-tracker-8xwj.onrender.com'

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
      resolve(window.pdfjsLib)
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

async function extractTextFromPdf(file) {
  const pdfjsLib = await loadPdfJs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  let text = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    text += content.items.map(item => item.str).join(' ') + '\n'
  }
  return text.trim()
}

export default function Resume({ token }) {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [extracting, setExtracting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState(null)
  const [resumeName, setResumeName] = useState('')
  const [toast, setToast] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const fileInputRef = useRef(null)

  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: { Authorization: token, ...options.headers },
    })
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    authFetch(`${API}/api/resumes`)
      .then(r => r.json())
      .then(data => { setResumes(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      showToast('Please upload a PDF file')
      return
    }
    setExtracting(true)
    try {
      const text = await extractTextFromPdf(file)
      const defaultName = file.name.replace(/\.pdf$/i, '')
      setResumeName(defaultName)
      setPreview({ content: text })
    } catch {
      showToast('Failed to extract text from PDF')
    } finally {
      setExtracting(false)
    }
  }, [])

  async function handleUpload() {
    if (!preview || !resumeName.trim()) return
    setUploading(true)
    try {
      const res = await authFetch(`${API}/api/resumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: resumeName.trim(), content: preview.content }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Upload failed')
      }
      const created = await res.json()
      setResumes(prev => [created, ...prev])
      setPreview(null)
      setResumeName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      showToast('Resume uploaded!')
    } catch (e) {
      showToast(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSetDefault(id) {
    const res = await authFetch(`${API}/api/resumes/${id}/default`, { method: 'PATCH' })
    if (!res.ok) return showToast('Failed to set default')
    setResumes(prev => prev.map(r => ({ ...r, is_default: r.id === id })))
    showToast('Default resume updated!')
  }

  async function handleDelete(id) {
    const res = await authFetch(`${API}/api/resumes/${id}`, { method: 'DELETE' })
    if (!res.ok) return showToast('Delete failed')
    setResumes(prev => prev.filter(r => r.id !== id))
    setConfirmDeleteId(null)
    showToast('Resume deleted!')
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Resume</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload your CV versions and set a default for match scoring.
          {resumes.length > 0 && (
            <span className="ml-2 text-gray-600">({resumes.length}/5 versions)</span>
          )}
        </p>
      </div>

      {/* Upload area */}
      {!preview && (
        <div
          className={`rounded-2xl p-8 mb-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${dragOver ? 'border-[#7209b7]' : ''}`}
          style={{
            ...cardStyle,
            border: dragOver
              ? '1.5px dashed #7209b7'
              : '1.5px dashed rgba(255,255,255,0.1)',
            background: dragOver ? 'rgba(114,9,183,0.06)' : cardStyle.background,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            handleFile(e.dataTransfer.files[0])
          }}
        >
          {extracting ? (
            <>
              <div className="w-8 h-8 border-2 border-[#7209b7] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Extracting text from PDF…</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(114,9,183,0.15)' }}>
                <svg className="w-5 h-5 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Drop your PDF here</p>
                <p className="text-xs text-gray-500 mt-1">or click to browse</p>
              </div>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Preview & name form */}
      {preview && (
        <div className="rounded-2xl p-6 mb-6" style={cardStyle}>
          <p className="text-xs font-bold uppercase tracking-widest text-[#a78bfa] mb-4">
            PDF extracted — review &amp; save
          </p>

          <div className="mb-4">
            <label className="text-xs text-gray-500 mb-1 block">Resume name</label>
            <input
              type="text"
              value={resumeName}
              onChange={e => setResumeName(e.target.value)}
              placeholder='e.g. "AI Engineer FR"'
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-white/30 placeholder-gray-600"
            />
          </div>

          <div className="mb-5">
            <label className="text-xs text-gray-500 mb-1 block">Content preview (first 200 chars)</label>
            <div className="rounded-lg px-3 py-2 text-xs text-gray-400 leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {preview.content.slice(0, 200)}
              {preview.content.length > 200 && (
                <span className="text-gray-600"> …({preview.content.length.toLocaleString()} chars total)</span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !resumeName.trim()}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(90deg, #7209b7, #f72585)' }}
            >
              {uploading ? 'Saving…' : 'Save resume'}
            </button>
            <button
              onClick={() => { setPreview(null); setResumeName(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
              className="px-5 py-2 rounded-lg text-sm text-gray-500 hover:text-white border border-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Resume list */}
      {loading ? (
        <p className="text-sm text-gray-600">Loading…</p>
      ) : resumes.length === 0 ? (
        <div className="rounded-2xl p-6 text-center" style={cardStyle}>
          <p className="text-sm text-gray-500">No resumes yet. Upload your first CV above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {resumes.map(r => (
            <div key={r.id} className="rounded-2xl transition-all hover:bg-white/[0.03]" style={cardStyle}>
              <div className="p-5 flex items-center gap-4">
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: r.is_default ? 'rgba(247,37,133,0.15)' : 'rgba(255,255,255,0.04)',
                    border: r.is_default ? '1px solid rgba(247,37,133,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}>
                  <svg className="w-4 h-4" style={{ color: r.is_default ? '#f72585' : '#6b7280' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                    {r.is_default && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(247,37,133,0.15)', color: '#f72585' }}>
                        default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    <span className="mx-1">·</span>
                    {r.content.length.toLocaleString()} chars
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setExpandedId(prev => prev === r.id ? null : r.id)}
                    className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                  >
                    {expandedId === r.id ? 'Hide text' : 'View extracted text'}
                  </button>
                  {!r.is_default && (
                    <button
                      onClick={() => handleSetDefault(r.id)}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDeleteId(r.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {expandedId === r.id && (
                <div className="px-5 pb-5">
                  <div className="rounded-lg px-3 py-2 text-xs text-gray-400 leading-relaxed whitespace-pre-wrap break-words max-h-64 overflow-y-auto"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {r.content}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="rounded-xl p-6 flex flex-col gap-4 w-72"
            style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-white font-medium">Delete this resume?</p>
            <p className="text-gray-400 text-sm">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
