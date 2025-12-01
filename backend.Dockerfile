FROM python:3.13-slim

# environmental settings for Poetry
ENV \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_VIRTUALENVS_IN_PROJECT=false \
    POETRY_NO_INTERACTION=1

RUN apt-get update \
    && apt-get install --no-install-recommends -y \
        curl \
        build-essential

# Poetry installation
RUN curl -sSL https://install.python-poetry.org | python3 -

ENV PATH="/root/.local/bin:$PATH"

# declare the Docker working directory
WORKDIR /app

COPY backend/pyproject.toml backend/poetry.lock* ./

RUN poetry install

COPY backend ./
