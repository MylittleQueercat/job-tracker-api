# job-tracker-api

![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![pytest](https://img.shields.io/badge/Tests-15%20passed-success?style=flat-square&logo=pytest&logoColor=white)

A RESTful API for tracking job applications and interview rounds, built with FastAPI and PostgreSQL.

- **Site**: [jobterminal.netlify.app](https://jobterminal.netlify.app)

---

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | PostgreSQL (Supabase) |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose + passlib) |
| Validation | Pydantic v2 |
| Testing | pytest + SQLite in-memory |
| Deployment | Render + Supabase |

---

## API

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /register | Create account |
| POST | /login | Get JWT token |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| GET | /jobs | List applications (filterable by status) |
| GET | /jobs/{id} | Get single application |
| POST | /jobs | Create application |
| PATCH | /jobs/{id} | Partial update |
| DELETE | /jobs/{id} | Delete (cascades to interviews) |

### Interviews
| Method | Endpoint | Description |
|---|---|---|
| GET | /jobs/{id}/interviews | List interview rounds |
| POST | /jobs/{id}/interviews | Add round |
| PATCH | /jobs/{id}/interviews/{iid} | Update round |
| DELETE | /jobs/{id}/interviews/{iid} | Delete round |

---

## Status state machine

```
applied → phone_screen → technical_test → interview → final_interview → offer
                                                                       ↘ rejected
                                                                       ↘ no_response
```

Invalid values are rejected at the schema level with `422`.

---

## Run locally

```bash
git clone https://github.com/MylittleQueerCat/job-tracker-api.git
cd job-tracker-api
docker-compose up --build
# → http://localhost:8000/docs
```

Or without Docker:

```bash
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Required env vars: `DB_URL`, `SECRET_KEY`

---

## Tests

```bash
pytest tests/ -v
# 15 passed
```

Covers: auth, CRUD, status filtering, 404 handling, auth protection, interview rounds. Each test runs against an isolated in-memory SQLite database via `dependency_overrides`.
