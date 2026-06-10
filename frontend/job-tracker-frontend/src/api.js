const API = 'https://job-tracker-8xwj.onrender.com'

export async function parseJD(authFetch, text, userApiKey) {
  const res = await authFetch(`${API}/api/parse-jd`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, user_api_key: userApiKey || null })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Parsing failed')
  }
  return res.json()
}

export async function generateFollowUp(authFetch, job, language, userApiKey) {
  const res = await authFetch(`${API}/api/generate-followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      company: job.company,
      position: job.position,
      created_at: job.created_at,
      language,
      user_api_key: userApiKey || null
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Generation failed')
  }
  return res.json()
}

export async function generateCompanyBrief(authFetch, job, language, userApiKey) {
  const res = await authFetch(`${API}/api/company-brief`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: job.id,
      company: job.company,
      position: job.position,
      language,
      user_api_key: userApiKey || null
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Generation failed')
  }
  return res.json()
}
