FROM python:3.11-slim

# Prevent python from buffering stdout/stderr
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements from root context
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source folder
COPY backend /app/backend

# Create directory for persistent SQLite DB and log files
RUN mkdir -p /app/data

EXPOSE 8000

# Run FastAPI backend using uvicorn
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
