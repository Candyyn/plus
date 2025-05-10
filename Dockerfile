# This was copied and pasted from https://bun.sh/guides/ecosystem/docker

# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

FROM base AS install
RUN mkdir -p /temp
COPY package.json bun.lockb /temp/
RUN cd /temp && bun install --frozen-lockfile

FROM install AS prerelease
COPY --from=install /temp/node_modules node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build


FROM base AS release
COPY --chown=bun:bun --from=install /temp/node_modules node_modules
COPY --chown=bun:bun --from=prerelease /usr/src/app/.output .
USER bun
ENV NUXT_HOST 0.0.0.0
ENV PORT 3050
EXPOSE 3050
ENTRYPOINT [ "bun", "run", "server/index.mjs" ]

