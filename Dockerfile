# Base image
FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY package.json yarn.lock* ./

RUN yarn install

COPY . .

RUN yarn build

# Production image
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package.json yarn.lock* ./

RUN yarn install --production --frozen-lockfile || yarn install --production

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
