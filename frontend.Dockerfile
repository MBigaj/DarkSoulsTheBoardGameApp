FROM node:latest

# declare the Docker working directory
WORKDIR /app

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./

# exposing the port for dev purposes (npm default port)
EXPOSE 3000

CMD ["npm", "start"]