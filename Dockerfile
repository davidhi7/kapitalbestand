FROM node:19

WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm install
COPY backend/dist/ ./dist/
COPY frontend/dist ./static/

EXPOSE 8080
VOLUME /usr/src/app
ENV NODE_ENV=production
CMD [ "node", "dist/app.js" ]
