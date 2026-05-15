# 🗄️ Setup Database PostgreSQL untuk Sherlock

## Prerequisites

- Docker Desktop terinstall dan berjalan
- Python 3.11+ terinstall (dengan pip)
- Node.js 18+ terinstall

## ⚠️ Troubleshooting Python/Pip Issues

### Jika "No module named pip"

Python Anda mungkin tidak memiliki pip. Solusi:

**Option 1: Install pip (Recommended)**
```powershell
# Download get-pip.py
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py

# Install pip
python get-pip.py

# Verify
python -m pip --version
```

**Option 2: Gunakan Python dari Microsoft Store atau python.org**

Download dan install Python dari:
- https://www.python.org/downloads/ (Recommended)
- Microsoft Store (search "Python 3.11" atau "Python 3.12")

Pastikan centang "Add Python to PATH" saat install.

**Option 3: Gunakan Virtual Environment**
```powershell
# Buat virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Jika error execution policy, jalankan dulu:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt
```

## 📋 Langkah-langkah Setup

### 1. Setup Backend Dependencies

**Jika pip sudah terinstall:**

```powershell
cd backend
pip install -r requirements.txt
```

**Atau dengan python -m pip:**

```powershell
cd backend
python -m pip install -r requirements.txt
```

**Atau dengan virtual environment (Recommended):**

```powershell
cd backend

# Buat venv
python -m venv venv

# Activate
.\venv\Scripts\Activate.ps1

# Install
pip install -r requirements.txt
```

### 2. Start PostgreSQL Database

Dari root directory project:

```powershell
docker-compose up -d
```

Verifikasi PostgreSQL berjalan:

```powershell
docker ps
```

Anda harus melihat container `sherlock-postgres` dengan status `Up`.

### 3. Run Database Migrations

Dari directory `backend`:

```powershell
cd backend

# Jika menggunakan venv, pastikan sudah activated
# .\venv\Scripts\Activate.ps1

alembic upgrade head
```

Ini akan membuat semua tabel yang diperlukan di database.

### 4. Setup Frontend Dependencies

```powershell
cd frontend
npm install
```

### 5. Start Development Servers

#### Option A: Menggunakan Script (Recommended)

Dari root directory:

```powershell
.\start-dev.ps1
```

Ini akan membuka 2 terminal windows:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000

#### Option B: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend

# Jika menggunakan venv
.\venv\Scripts\Activate.ps1

python run.py
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 🔍 Verifikasi Setup

### 1. Cek Database Connection

Buka browser ke: http://localhost:8000/health

Response harus menunjukkan:
```json
{
  "status": "healthy",
  "service": "sherlock-api",
  "version": "1.0.0",
  "bob_mock_mode": true
}
```

### 2. Cek API Documentation

Buka: http://localhost:8000/docs

Anda akan melihat Swagger UI dengan semua API endpoints.

### 3. Cek Frontend

Buka: http://localhost:3000

Anda akan melihat Sherlock dashboard.

### 4. Test Database Integration

Gunakan API untuk create incident:

```powershell
curl -X POST "http://localhost:8000/api/incidents/" `
  -H "Content-Type: application/json" `
  -d '{
    "raw_input": "Test incident",
    "repo_path": "../fixtures/flaky-shop"
  }'
```

Kemudian list incidents:

```powershell
curl "http://localhost:8000/api/incidents/"
```

## 🗄️ Database Schema

Database `sherlock_db` memiliki tabel-tabel berikut:

- **incidents** - Main incident records
- **triage_results** - Triage analysis results
- **forensics_results** - Forensics investigation results
- **root_cause_analyses** - Root cause analysis
- **fix_proposals** - Proposed fixes
- **agent_events** - Agent activity logs

## 🔧 Database Management

### Connect ke PostgreSQL

```powershell
docker exec -it sherlock-postgres psql -U sherlock -d sherlock_db
```

### Useful SQL Commands

```sql
-- List all tables
\dt

-- View incidents
SELECT id, title, status, created_at FROM incidents;

-- View incident with all related data
SELECT * FROM incidents WHERE id = 'inc-xxxxx';

-- Count incidents by status
SELECT status, COUNT(*) FROM incidents GROUP BY status;
```

### Reset Database

Jika perlu reset database:

```powershell
# Stop dan remove container
docker-compose down -v

# Start ulang
docker-compose up -d

# Run migrations lagi
cd backend
alembic upgrade head
```

## 🔐 Database Configuration

Database credentials ada di file `.env`:

```env
SHERLOCK_DATABASE_URL=postgresql+asyncpg://sherlock:sherlock_dev_password@localhost:5432/sherlock_db
```

**⚠️ PENTING:** Untuk production, ganti password dengan yang lebih aman!

## 📊 Database Monitoring

### View Logs

```powershell
docker logs sherlock-postgres
```

### Check Database Size

```sql
SELECT pg_size_pretty(pg_database_size('sherlock_db'));
```

### View Active Connections

```sql
SELECT * FROM pg_stat_activity WHERE datname = 'sherlock_db';
```

## 🐛 Troubleshooting

### `pip` tidak dikenali atau "No module named pip"

**Solusi 1: Install pip**
```powershell
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
python get-pip.py
```

**Solusi 2: Gunakan virtual environment**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Solusi 3: Install Python yang proper**
Download dari https://www.python.org/downloads/ dan pastikan centang "Add Python to PATH"

### Execution Policy Error (PowerShell)

Jika error saat activate venv:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port 5432 Already in Use

Jika port 5432 sudah digunakan, edit `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Ganti ke port lain
```

Kemudian update `SHERLOCK_DATABASE_URL` di `.env`:

```env
SHERLOCK_DATABASE_URL=postgresql+asyncpg://sherlock:sherlock_dev_password@localhost:5433/sherlock_db
```

### Migration Errors

Jika ada error saat migration:

```powershell
# Rollback ke revision sebelumnya
alembic downgrade -1

# Atau rollback semua
alembic downgrade base

# Kemudian upgrade lagi
alembic upgrade head
```

### Connection Refused

Pastikan PostgreSQL container berjalan:

```powershell
docker ps | Select-String sherlock-postgres
```

Jika tidak ada, start container:

```powershell
docker-compose up -d
```

### Python Module Not Found

Jika ada error "No module named 'xxx'", pastikan dependencies terinstall:

```powershell
# Dengan venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Atau tanpa venv
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## 📝 Next Steps

Setelah setup selesai:

1. ✅ Database PostgreSQL berjalan
2. ✅ Backend API terhubung ke database
3. ✅ Frontend dapat berkomunikasi dengan backend
4. ✅ Data incident tersimpan persistent di database

Anda siap untuk:
- Submit incidents via API
- View incident history
- Analyze incidents dengan AI agents
- Generate postmortem reports

Semua data akan tersimpan di PostgreSQL dan tidak akan hilang saat restart!

## 🚀 Quick Start Commands (Recommended dengan Virtual Environment)

```powershell
# 1. Setup backend dengan virtual environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 2. Start PostgreSQL
cd ..
docker-compose up -d

# 3. Run migrations
cd backend
alembic upgrade head

# 4. Install frontend dependencies
cd ../frontend
npm install

# 5. Start servers
cd ..
.\start-dev.ps1
```

## 💡 Tips

- **Gunakan Virtual Environment** untuk isolasi dependencies
- **Pastikan Docker Desktop running** sebelum start PostgreSQL
- **Check logs** jika ada error: `docker logs sherlock-postgres`
- **Gunakan API docs** di http://localhost:8000/docs untuk testing
