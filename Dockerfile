# Dockerfile for Malaconstruction app
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose the port the app runs on (default 3000 in code, adjust if needed)
EXPOSE 3000

# Start the app (development mode; for production you may replace with a build step)
CMD ["npm", "run", "dev"]
