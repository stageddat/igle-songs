# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# dependencias
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# build de next (salida standalone)
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# imagen final
FROM node:22-bookworm-slim AS runner

# libreoffice (pptx -> pdf), poppler (pdf -> png) y fuentes chinas para las letras
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libreoffice-impress \
        poppler-utils \
        fonts-noto-cjk \
        fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=9999 \
    HOSTNAME=0.0.0.0 \
    HOME=/home/node

WORKDIR /app

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
# carpeta para archivos en proceso; en producción se monta ./data como volumen
RUN mkdir data && chown node:node data

USER node
EXPOSE 9999

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:9999/api/songs').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
