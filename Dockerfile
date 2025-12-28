# Use Node.js 22
FROM node:22-bullseye

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends --fix-missing \
        ffmpeg \
        python3 \
        python3-pip \
        curl && \
    pip3 install --no-cache-dir streamlink yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Set working dir
WORKDIR /app

# CRITICAL: Correct env var name to skip postinstall GitHub fetch
ENV YOUTUBE_DL_SKIP_DOWNLOAD=true

# Copy package.json
COPY package*.json ./

# Now npm install (postinstall script sees the env var and skips)
RUN npm install --production

# Copy all source files
COPY . .

# Run your worker
CMD ["node", "src/workers/worker.js"]