# Production image: Next.js + Python Playwright Maps scraper
FROM node:20-bookworm-slim

WORKDIR /app

# System deps for Playwright Chromium + Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Playwright browsers land here (shared by root runtime)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PYTHONUNBUFFERED=1

# App dependencies first (better layer cache)
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# Scraper Python deps + Chromium (with OS libraries)
COPY Gmap-scrapper/requirements.txt ./Gmap-scrapper/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r Gmap-scrapper/requirements.txt \
    && python3 -m playwright install --with-deps chromium

# Rest of the app
COPY . .
RUN npm run build \
    && npm prune --omit=dev

# Railway sets PORT; start script syncs DB then boots standalone
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
CMD ["node", "scripts/start-railway.mjs"]
