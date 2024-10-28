# Stage 1: Install All Dependencies and Build Project
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Create Minimal Image with Production Dependencies Only
FROM node:18-alpine

WORKDIR /app
# Copy the built assets and node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/node_modules /app/node_modules
# Copy the views directory for EJS templates
COPY --from=builder /app/views /app/views
# Copy the public directory for static assets
COPY --from=builder /app/public /app/public

EXPOSE 4000
ENV NODE_ENV=production
CMD ["node", "/app/dist/index.cjs"]
