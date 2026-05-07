FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

COPY python-core/requirements.txt ./python-core/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install -r python-core/requirements.txt

COPY python-core ./python-core

EXPOSE 8010

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8010} --app-dir python-core"]
