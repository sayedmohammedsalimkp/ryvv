FROM python:3.12-slim

WORKDIR /app

# DejaVu so PDF export can draw ₹ on Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV APP_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Render sets $PORT; local default 8000
CMD ["sh", "-c", "gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8000} --workers 1 --timeout 120"]
