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

# Use run.py which reads PORT from env via Python (Railway sets it dynamically)
CMD ["python", "run.py"]
