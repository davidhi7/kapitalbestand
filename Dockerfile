FROM node:19

WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm install
COPY backend/src/ ./src/
COPY frontend/dist ./static/

EXPOSE 8080
VOLUME /usr/src/app
ENV NODE_ENV=production
CMD [ "node", "src/app.js" ]
