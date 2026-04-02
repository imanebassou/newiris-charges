FROM python:3.12-slim

WORKDIR /app

# Install ODBC driver for SQL Server
RUN apt-get update && apt-get install -y \
    unixodbc \
    unixodbc-dev \
    libodbc2 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/media

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]