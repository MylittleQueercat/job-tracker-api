# Job Tracker API

![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![pytest](https://img.shields.io/badge/Tests-15%20passed-success?style=for-the-badge&logo=pytest&logoColor=white)

A RESTful API to track job applications and interview rounds, built with FastAPI and PostgreSQL.  
**🌐 Live demo**: https://job-tracker-8xwj.onrender.com/docs

> Built as a real tool to track my own internship search — not just a tutorial project.

---

## ✨ Features

- ✅ Full CRUD for job applications
- ✅ Interview round tracking (multiple rounds per application)
- ✅ Application status state machine (applied → interview → offer → rejected...)
- ✅ Filter applications by status (`GET /jobs?status=interview`)
- ✅ JWT authentication (register / login / protected routes)
- ✅ Per-user data isolation
- ✅ Pydantic v2 validation on all inputs
- ✅ pytest test suite (15 tests)
- ✅ Docker + docker-compose
- ✅ Deployed on Render.com + Supabase

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Language | Python 3.11 |
| Database | PostgreSQL (Supabase) |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose + passlib/bcrypt) |
| Validation | Pydantic v2 |
| Testing | pytest + SQLite (in-memory) |
| Containerization | Docker + docker-compose |
| Deployment | Render.com |

---

## 📁 Project Structure

```
job-tracker-api/
├── app/
│   ├── main.py          # App entry point, router registration
│   ├── database.py      # DB connection and session management
│   ├── models/
│   │   ├── user.py      # User model
│   │   └── job.py       # Job + Interview models
│   ├── routers/
│   │   ├── auth.py      # Register / Login routes
│   │   └── jobs.py      # Jobs + Interviews routes
│   └── schemas/
│       ├── user.py      # User request/response schemas
│       └── job.py       # Job + Interview schemas with validation
├── auth.py              # JWT logic
├── conftest.py          # pytest fixtures
├── tests/
│   └── test_jobs.py     # 15 tests
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## 🔌 API Endpoints

### 🔐 Auth
| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| POST | /register | Create a new user | ❌ |
| POST | /login | Get JWT token | ❌ |

### 📋 Jobs
| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | /jobs | Get all applications (filterable by status) | ✅ |
| GET | /jobs/{id} | Get a specific application | ✅ |
| POST | /jobs | Create a new application | ✅ |
| PATCH | /jobs/{id} | Update application (partial update) | ✅ |
| DELETE | /jobs/{id} | Delete application + all its interviews | ✅ |

### 🗓 Interviews
| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| GET | /jobs/{id}/interviews | Get all interview rounds for a job | ✅ |
| POST | /jobs/{id}/interviews | Add an interview round | ✅ |
| PATCH | /jobs/{id}/interviews/{iid} | Update an interview round | ✅ |
| DELETE | /jobs/{id}/interviews/{iid} | Delete an interview round | ✅ |

---

## 📊 Application Status State Machine

```
applied → phone_screen → technical_test → interview → final_interview → offer
                                                                       ↘ rejected
                                                                       ↘ withdrawn
                                                                       ↘ ghosted
```

Invalid status values are rejected with a `422 Unprocessable Entity` response.

---

## 🚀 Run Locally

### Option 1 — Docker (recommended)

```bash
git clone https://github.com/MylittleQueerCat/job-tracker-api.git
cd job-tracker-api
docker-compose up --build
```

API available at: http://localhost:8000/docs

### Option 2 — Virtual environment

```bash
git clone https://github.com/MylittleQueerCat/job-tracker-api.git
cd job-tracker-api

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file:
```
DB_URL=postgresql://localhost/jobtracker
SECRET_KEY=your_secret_key
```

```bash
uvicorn app.main:app --reload
```

API available at: http://localhost:8000/docs

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `DB_URL` | PostgreSQL connection URL |
| `SECRET_KEY` | Secret key for signing JWT tokens |

---

## 🧪 Run Tests

Tests use an in-memory SQLite database — no PostgreSQL needed.

```bash
pytest tests/ -v
```

```
15 passed in 10.80s
```

Test coverage:
- Auth: register, duplicate user, login, wrong password
- Jobs: create, list, filter by status, get by id, update, delete, 404
- Auth protection: unauthorized access blocked
- Interviews: add round, list rounds

---

## 📚 Key Concepts Implemented

**🗄️ One-to-Many Relationship**  
Each `Job` has multiple `Interview` records. SQLAlchemy's `relationship()` handles the join automatically. Deleting a job cascades to all its interviews (`cascade="all, delete"`).

**🔀 PATCH vs PUT**  
`PATCH` updates only the fields provided (`exclude_unset=True`), leaving others unchanged. `PUT` requires sending the full object every time. PATCH is more appropriate for partial updates.

**🎛️ Status State Machine**  
Application status is validated against a fixed set of values at the schema level. Invalid values are rejected before hitting the database — fail fast at the boundary.

**🧪 Test Isolation**  
Each test runs against a fresh SQLite database. The `conftest.py` fixtures handle setup and teardown automatically — no test pollution between runs. The real PostgreSQL connection is overridden via `app.dependency_overrides`.