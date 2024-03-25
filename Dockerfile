FROM node:21 as builder
WORKDIR /build
COPY backend/ ./backend
COPY frontend/ ./frontend
WORKDIR backend
# without further arguments and NODE_ENV=production, dev packages are installed as well
RUN npm ci
RUN npm run build
WORKDIR ../frontend
RUN npm ci
RUN npm run build


FROM node:21
# with this env, no dev packages are being installed
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm ci
COPY --from=builder /build/backend/dist/ ./dist/
COPY --from=builder /build/frontend/dist ./static/
EXPOSE 8080
VOLUME /usr/src/app
CMD [ "node", "dist/app.js" ]
