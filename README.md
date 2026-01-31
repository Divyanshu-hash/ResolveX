# ResolveX – Complaint / Issue Management System

Enterprise-style grievance handling for colleges, hostels, offices, housing societies, and municipal bodies. Ensures **transparency**, **accountability**, **automation**, and **data-driven improvement**.

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18 (Vite), React Router, Axios, Tailwind CSS, Recharts |
| Backend  | FastAPI (Python), JWT, SQLAlchemy, APScheduler |
| Database | MySQL 8.x                           |

---

## Features

- **4 roles**: Normal User (complaint creator), Staff (handler), Admin (manager), Super Admin (system controller)
- **JWT auth** with role-based access; protected routes
- **Complaint lifecycle**: Submitted → Categorized → Assigned → In Progress → Resolved → Closed
- **Smart categorization**: Backend auto-assigns category and priority from description keywords (e.g. electric, security → high)
- **Escalation**: Background job escalates overdue complaints (configurable SLA, e.g. 3 days)
- **Evidence**: Upload images (JPG, PNG, GIF, WebP) and PDFs; stored in MySQL and filesystem
- **Timeline**: Full audit log of status/assignment/priority changes
- **Feedback**: Users rate resolution (1–5) after complaint is resolved
- **Analytics**: SQL-driven metrics (total/open/resolved/escalated, by category/priority/month, staff performance); charts on frontend

---

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **MySQL** 8.x
- **Git**

---

## 1. Database Setup

1. Create database and user:

```sql
CREATE DATABASE resolvex CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'resolvex'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON resolvex.* TO 'resolvex'@'localhost';
FLUSH PRIVILEGES;
```

2. Run schema:

```bash
mysql -u resolvex -p resolvex < database/schema.sql
```

---

## 2. Backend Setup

1. Create virtual environment and install dependencies:

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

2. Environment:

```bash
copy .env.example .env   # Windows
# cp .env.example .env  # macOS/Linux
```

Edit `.env`:

```env
DATABASE_URL=mysql+pymysql://resolvex:your_password@localhost:3306/resolvex
SECRET_KEY=your-super-secret-key-at-least-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=10
SLA_DAYS=3
ESCALATION_ENABLED=true
```

3. Create uploads directory (optional; created automatically on first upload):

```bash
mkdir uploads
```

4. Run backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: **http://localhost:8000/docs**

---

## 3. Frontend Setup

1. Install and run:

```bash
cd frontend
npm install
npm run dev
```

Frontend: **http://localhost:5173**

2. (Optional) Point API manually: if backend is not on same host, set Vite proxy in `frontend/vite.config.ts` or use env for API base URL.

---

## 4. First Super Admin

1. Register a normal user via **Register** in the app.
2. In MySQL:

```sql
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

3. Log in again; you will see **Analytics** and **Users** and can create staff/admin accounts from the Users page.

---

## 5. Project Structure

```
ResolveX/
├── backend/
│   ├── main.py              # FastAPI app, CORS, scheduler
│   ├── config.py            # Settings from env
│   ├── database.py          # SQLAlchemy engine, session
│   ├── auth.py              # JWT, password hashing
│   ├── dependencies.py      # get_current_user, role guards
│   ├── models.py            # ORM models
│   ├── schemas.py           # Pydantic request/response
│   ├── routers/
│   │   ├── auth.py          # login, register, me
│   │   ├── complaints.py    # CRUD, assign, logs
│   │   ├── evidence.py      # upload, list, download
│   │   ├── feedback.py      # submit, get
│   │   ├── analytics.py     # SQL summary
│   │   └── users.py         # list, create (admin)
│   └── services/
│       ├── categorization.py  # Smart category/priority
│       ├── escalation.py      # Overdue escalation job
│       └── complaint_log.py   # Timeline entries
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx          # Routes, private/role guards
│   │   ├── context/AuthContext.tsx
│   │   ├── components/Layout.tsx
│   │   └── pages/           # Dashboard, Complaints, Detail, Analytics, Users, Login, Register
│   └── tailwind.config.js
├── database/
│   └── schema.sql           # Full MySQL schema + seed data
└── README.md
```

---

## 6. Deployment Notes

- **Production**: Set strong `SECRET_KEY`, restrict CORS `allow_origins`, use HTTPS.
- **MySQL**: Tune connection pool; ensure backups.
- **Uploads**: Store `UPLOAD_DIR` on persistent volume; consider object storage (S3) for scale.
- **Frontend**: `npm run build` and serve `dist/` via Nginx or static host; proxy `/api` to FastAPI.
- **Backend**: Run with Gunicorn + Uvicorn workers behind a reverse proxy.

---

## 7. API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/auth/login`   | Login (form: username=email, password) |
| POST   | `/api/auth/register` | Register (JSON) |
| GET    | `/api/auth/me`     | Current user (JWT) |
| GET/POST | `/api/complaints` | List / create complaints |
| GET/PATCH | `/api/complaints/{id}` | Get / update complaint |
| POST   | `/api/complaints/{id}/assign` | Assign to staff (admin) |
| GET    | `/api/complaints/{id}/logs` | Timeline |
| POST/GET | `/api/evidence/{complaint_id}` | Upload / list evidence |
| GET    | `/api/evidence/file/{id}` | Download (auth) |
| POST/GET | `/api/feedback/{complaint_id}` | Submit / get feedback |
| GET    | `/api/analytics/summary` | Dashboard metrics (admin) |
| GET    | `/api/users`, `/api/users/staff` | List users / staff |
| POST   | `/api/users`       | Create user (super_admin) |

---

## License

MIT.
