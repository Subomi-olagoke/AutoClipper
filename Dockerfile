# Use Node.js 22
FROM node:22-bullseye

# Install system dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip curl && \
    pip3 install streamlink && \
    rm -rf /var/lib/apt/lists/*

# Set working dir
WORKDIR /app

# Copy package.json & install
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Run your worker
CMD ["node", "src/workers/worker.js"]
