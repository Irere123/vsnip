FROM node:22.2.0-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV npm_config_unsafe_perm true

RUN corepack prepare pnpm@9.1.0 --activate
RUN corepack enable
    
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nodejs

COPY . /app

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && \
    chown nodejs:nodejs /app/docker-entrypoint.sh && \
    chmod +x /app/docker-entrypoint.sh

RUN chown -R nodejs:nodejs /app

USER nodejs

FROM base AS prod-deps
WORKDIR /app
USER root
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod
RUN chown -R nodejs:nodejs /app/node_modules
USER nodejs

FROM base AS build
WORKDIR /app
USER root
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install && pnpm run build
RUN chown -R nodejs:nodejs /app/dist
USER nodejs

FROM node:22.2.0-slim
ENV NODE_ENV production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV npm_config_unsafe_perm true

WORKDIR /app

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nodejs

COPY --from=build /app/dist /app/dist
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=base /app/docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3002

ENTRYPOINT ["/app/docker-entrypoint.sh"]
