import pytest

# ── Auth ──────────────────────────────────────────────

def test_register(client):
    response = client.post("/register", json={
        "username": "newuser",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "newuser" in response.json()["message"]

def test_register_duplicate(client, registered_user):
    response = client.post("/register", json={
        "username": "testuser",
        "password": "password123"
    })
    assert response.status_code == 400

def test_login(client, registered_user):
    response = client.post("/login", data={
        "username": "testuser",
        "password": "testpass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_wrong_password(client, registered_user):
    response = client.post("/login", data={
        "username": "testuser",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

# ── Jobs ──────────────────────────────────────────────

def test_create_job(client, auth_headers):
    response = client.post("/jobs/", json={
        "company": "Google",
        "position": "Backend Intern",
        "status": "applied"
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["company"] == "Google"

def test_create_job_invalid_status(client, auth_headers):
    response = client.post("/jobs/", json={
        "company": "Google",
        "position": "Backend Intern",
        "status": "invalid_status"
    }, headers=auth_headers)
    assert response.status_code == 422

def test_get_jobs(client, auth_headers):
    client.post("/jobs/", json={"company": "Google", "position": "Intern", "status": "applied"}, headers=auth_headers)
    client.post("/jobs/", json={"company": "Meta", "position": "Intern", "status": "interview"}, headers=auth_headers)
    response = client.get("/jobs/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2

def test_get_jobs_filter_by_status(client, auth_headers):
    client.post("/jobs/", json={"company": "Google", "position": "Intern", "status": "applied"}, headers=auth_headers)
    client.post("/jobs/", json={"company": "Meta", "position": "Intern", "status": "interview"}, headers=auth_headers)
    response = client.get("/jobs/?status=applied", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["company"] == "Google"

def test_get_job_by_id(client, auth_headers):
    created = client.post("/jobs/", json={"company": "Google", "position": "Intern", "status": "applied"}, headers=auth_headers)
    job_id = created.json()["id"]
    response = client.get(f"/jobs/{job_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["company"] == "Google"

def test_get_job_not_found(client, auth_headers):
    response = client.get("/jobs/999", headers=auth_headers)
    assert response.status_code == 404

def test_update_job(client, auth_headers):
    created = client.post("/jobs/", json={"company": "Google", "position": "Intern", "status": "applied"}, headers=auth_headers)
    job_id = created.json()["id"]
    response = client.patch(f"/jobs/{job_id}", json={"status": "interview"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "interview"

def test_delete_job(client, auth_headers):
    created = client.post("/jobs/", json={"company": "Google", "position": "Intern", "status": "applied"}, headers=auth_headers)
    job_id = created.json()["id"]
    response = client.delete(f"/jobs/{job_id}", headers=auth_headers)
    assert response.status_code == 200
    response = client.get(f"/jobs/{job_id}", headers=auth_headers)
    assert response.status_code == 404

def test_unauthorized_access(client):
    response = client.get("/jobs/")
    assert response.status_code == 401

# ── Interviews ────────────────────────────────────────

def test_add_interview(client, auth_headers):
    created = client.post("/jobs/", json={"company": "Google", "position": "Intern", "status": "applied"}, headers=auth_headers)
    job_id = created.json()["id"]
    response = client.post(f"/jobs/{job_id}/interviews", json={
        "round": 1,
        "interview_type": "phone",
        "date": "2026-04-15",
        "notes": "First round"
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["round"] == 1

def test_get_interviews(client, auth_headers):
    created = client.post("/jobs/", json={"company": "Google", "position": "Intern", "status": "applied"}, headers=auth_headers)
    job_id = created.json()["id"]
    client.post(f"/jobs/{job_id}/interviews", json={"round": 1, "interview_type": "phone"}, headers=auth_headers)
    client.post(f"/jobs/{job_id}/interviews", json={"round": 2, "interview_type": "technical"}, headers=auth_headers)
    response = client.get(f"/jobs/{job_id}/interviews", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2