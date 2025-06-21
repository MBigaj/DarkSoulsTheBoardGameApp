FROM python:3.11-slim

# environmental settings for Poetry
ENV \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_VIRTUALENVS_IN_PROJECT=false \
    POETRY_NO_INTERACTION=1

# declare the Docker working directory
WORKDIR /app

RUN apt-get update

# installing potery
RUN pip install poetry

COPY backend/pyproject.toml backend/poetry.lock* ./

RUN poetry install

COPY backend ./

# exposing the port for dev purposes (fastapi default port)
EXPOSE 8000

CMD ["poetry", "run", "fastapi", "dev"]