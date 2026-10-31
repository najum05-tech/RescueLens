import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
from fastapi.testclient import TestClient
from app.main import app

def test_auth_flow():
    with TestClient(app) as c:
        assert c.get("/api/auth/me").status_code == 401
        r = c.post("/api/auth/register", json={"email": "a@b.com", "name": "Ali", "password": "password123"})
        assert r.status_code == 201 and r.json()["user"]["role"] == "citizen"
        h = {"Authorization": f"Bearer {r.json()['access_token']}"}
        assert c.get("/api/auth/me", headers=h).json()["email"] == "a@b.com"
        assert c.get("/api/users", headers=h).status_code == 403
        assert c.post("/api/auth/register", json={"email": "a@b.com", "name": "Ali", "password": "password123"}).status_code == 409
        adm = c.post("/api/auth/login", json={"email": "admin@rescuelens.dev", "password": "ChangeMe123!"}).json()["access_token"]
        assert c.get("/api/users", headers={"Authorization": f"Bearer {adm}"}).status_code == 200
        assert c.post("/api/auth/login", json={"email": "a@b.com", "password": "wrong"}).status_code == 401
