FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate \
    && pnpm install --frozen-lockfile

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && corepack prepare pnpm@10.18.3 --activate \
    && pnpm run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg ghostscript qpdf libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress \
    poppler-utils imagemagick tesseract-ocr ocrmypdf ca-certificates fonts-dejavu-core \
    python3 python3-pip zip \
    && python3 -m pip install --no-cache-dir --break-system-packages \
       yt-dlp PyMuPDF python-docx openpyxl python-pptx Pillow \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/data ./data
COPY --from=build /app/scripts ./scripts
EXPOSE 3000
CMD ["sh","-c","node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
