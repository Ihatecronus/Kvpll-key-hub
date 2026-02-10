FROM node:22-alpine

WORKDIR /app

# Copy bot files
COPY bot/package*.json ./bot/
COPY bot/Server.js ./bot/

# Install dependencies
WORKDIR /app/bot
RUN npm ci

# Expose port
EXPOSE ${PORT:-3000}

# Start bot
CMD npm start
