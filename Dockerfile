FROM node:19

WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm install
COPY backend/src/ ./src/
COPY frontend/dist ./static/

EXPOSE 8080
CMD [ "node", "src/app.js" ]
