FROM node:latest

# declare the Docker working directory
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
