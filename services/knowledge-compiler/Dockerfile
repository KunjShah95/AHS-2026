FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry

# Copy project files
COPY pyproject.toml .
COPY app ./app

# Install dependencies
RUN poetry install --no-interaction --no-venv

# Expose port
EXPOSE 3003

# Run the application
CMD ["poetry", "run", "python", "-m", "app.main"]