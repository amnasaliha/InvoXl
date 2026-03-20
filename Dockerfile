# Stage 1: Build the frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm install -w frontend
COPY frontend/ ./frontend/
RUN npm run build -w frontend

# Stage 2: Run the backend
FROM node:18-alpine
WORKDIR /app

# Install backend dependencies
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
RUN npm install -w backend --production

# Copy files
COPY backend/ ./backend/
COPY --from=builder /app/frontend/build ./frontend/build

# Final environment and launch
ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1

EXPOSE 5001

# Direct launch for better memory/stability
# Usage: CMD ["node", "folder/file"]
CMD ["node", "backend/server.js"]
