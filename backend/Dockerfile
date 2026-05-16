FROM python:3.11-slim

WORKDIR /app

# Install git (needed for GitPython in forensics agent)
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Copy fixtures from project root (needed for sample repo)
# NOTE: When using docker-compose, fixtures are mounted as a volume instead

EXPOSE 8000

# Use PORT env var (Railway sets it dynamically), default to 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
