FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY codegen.yml ./

RUN npm install

COPY . .

RUN npm run build

RUN npm prune --production

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_PRODUCTION=true

RUN addgroup -g 1001 -S app && \
    adduser -S -u 1001 -G app app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules

COPY --from=builder --chown=app:app /app/dist ./dist

COPY --from=builder --chown=app:app /app/GraphQL ./GraphQL

COPY --from=builder --chown=app:app /app/Proto ./Proto

COPY --chown=app:app package*.json ./

RUN mkdir -p Storage/uploads/images Storage/uploads/videos Storage/uploads/documents && \
    chown -R app:app /app

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/server.js"]
