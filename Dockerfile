# Use Node.js 22
FROM node:22-bullseye

# Install system deps + yt-dlp
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        python3 \
        python3-pip \
        curl && \
    pip3 install --no-cache-dir streamlink yt-dlp && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# COPY package files
COPY package*.json ./

# Install npm deps INSIDE Docker (Puppeteer downloads Linux Chromium = fast)
RUN npm install --production

# Copy source
COPY . .

CMD ["node", "src/workers/worker.js"]