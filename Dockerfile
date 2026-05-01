FROM rust:1-bookworm AS backend-builder
WORKDIR /build
COPY backend-v2/ ./backend-v2/
WORKDIR /build/backend-v2
ENV SQLX_OFFLINE=true
RUN cargo build --release --locked


FROM node:24-slim AS frontend-builder
WORKDIR /build
COPY package.json package-lock.json ./
COPY frontend/ ./frontend/
RUN npm ci --workspace=frontend
RUN npm run --workspace=frontend build


FROM debian:bookworm-slim
WORKDIR /usr/src/app
COPY --from=backend-builder /build/backend-v2/target/release/backend-v2 ./backend-v2
COPY --from=frontend-builder /build/frontend/dist ./static/
EXPOSE 8080
CMD ["./backend-v2"]
