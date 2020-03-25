FROM node:12.16.1-alpine3.9
WORKDIR /usr/src/app/
COPY package.json package-lock.json dist /usr/src/app/
COPY code.vb /usr/src/app/dist
RUN npm ci --production
CMD ["node", "app.js"]