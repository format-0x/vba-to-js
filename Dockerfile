FROM node:12.16.1
COPY ./dist /usr/src/app/
RUN npm i --production
CMD ["node", "app.js"]