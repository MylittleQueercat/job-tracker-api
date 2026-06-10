# Job Tracker

A full-stack job application tracker with AI-powered features and MCP server integration.

- **Live site**: [jobterminal.netlify.app](https://jobterminal.netlify.app)

---

## Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, PostgreSQL, SQLAlchemy 2.0, JWT |
| AI | Google Gemini API (gemini-2.5-flash-lite) |
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Deployment | Render (API), Netlify (frontend), Supabase (database) |

---

## Features

- **Job tracking** — add and manage applications with status, location, source, deadline
- **Interview records** — log interview rounds with type, date, and notes
- **Today's Focus** — surface actions that need attention: upcoming interviews, follow-up reminders, dead-zone alerts
- **Achievements** — milestone badges based on application activity
- **AI features**
  - Parse a job description and auto-fill company/position/location
  - Generate a follow-up email in French or English
  - Generate a company brief for interview preparation
- **MCP server** — connect Claude Desktop directly to your live data (see below)

---

## Status state machine

```
applied → technical_test → interview → final_interview → offer
                                                        ↘ rejected
                                                        ↘ withdrew
                                                        ↘ no_response
```

Invalid status values are rejected at the schema level with `422`.

---

## API endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /register | Create account |
| POST | /login | Get JWT token |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| GET | /jobs/ | List applications (optional `?status=` filter) |
| GET | /jobs/{id} | Get single application |
| POST | /jobs/ | Create application |
| PATCH | /jobs/{id} | Partial update |
| DELETE | /jobs/{id} | Delete (cascades to interviews) |

### Interviews
| Method | Endpoint | Description |
|---|---|---|
| GET | /jobs/{id}/interviews | List interview rounds |
| POST | /jobs/{id}/interviews | Add round |
| PATCH | /jobs/{id}/interviews/{iid} | Update round |
| DELETE | /jobs/{id}/interviews/{iid} | Delete round |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/parse-jd | Parse job description text |
| POST | /api/generate-followup | Generate follow-up email |
| POST | /api/company-brief | Generate company interview brief |

---

## MCP server

`mcp_server.py` exposes your live job data to Claude Desktop via the Model Context Protocol.

**Tools available:**

| Tool | Description |
|---|---|
| `get_jobs` | List all applications, optional status filter |
| `get_job_stats` | Total count, status distribution, interview rate |
| `get_jobs_needing_attention` | Jobs with no update for 7+ days |
| `add_job` | Create a new application |
| `update_job_status` | Update the status of an application |
| `generate_followup_email` | Generate a follow-up email for a job |

**Setup:**

1. Install dependencies:
   ```bash
   pip install mcp httpx
   ```

2. Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "job-tracker": {
         "command": "python",
         "args": ["/absolute/path/to/mcp_server.py"],
         "env": {
           "JOB_TRACKER_TOKEN": "<your JWT token>"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop. You can now ask Claude things like:
   - *"Which jobs need a follow-up?"*
   - *"Add a new application at Stripe for a backend engineer role."*
   - *"Generate a follow-up email for job #12 in French."*

---

## Run locally

**Backend:**

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

Required env vars: `DB_URL`, `SECRET_KEY`, `GEMINI_API_KEY` (optional — users can supply their own)

**Frontend:**

```bash
cd frontend/job-tracker-frontend
npm install
npm run dev
# → http://localhost:5173
```
