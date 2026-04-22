# Use Node.js LTS as the base image
FROM node:20-slim AS base

# Install build dependencies if needed
# RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the frontend assets
RUN npm run build

# Final production stage
FROM node:20-slim AS production

WORKDIR /app

# Copy built assets and necessary files from the base stage
COPY --from=base /app/dist ./dist
COPY --from=base /app/package*.json ./
COPY --from=base /app/server.ts ./
COPY --from=base /app/node_modules ./node_modules
# COPY --from=base /app/firebase-applet-config.json ./firebase-applet-config.json (Uncomment if using Firebase)

# Set environment to production
ENV NODE_ENV=production

# Expose the application port (3000 is required by the environment)
EXPOSE 3000

# Start the application using tsx for server.ts
CMD ["npm", "start"]
