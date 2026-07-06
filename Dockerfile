FROM node:24-bookworm-slim AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./

RUN corepack enable \
    && corepack prepare pnpm@10.18.3 --activate \
    && pnpm install --frozen-lockfile


FROM node:24-bookworm-slim AS build

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p public data scripts private-cookies \
    && corepack enable \
    && corepack prepare pnpm@10.18.3 --activate \
    && pnpm run build


FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/data ./data
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/private-cookies ./private-cookies

EXPOSE 3000

CMD ["sh", "-c", "node_modules/.bin/next start -H 0.0.0.0 -p ${PORT:-3000}"]
