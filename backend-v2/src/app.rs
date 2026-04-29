use std::{env, fs};

use anyhow::Context;
use axum::Router;
use axum_login::{
    AuthManagerLayerBuilder, login_required,
    tower_sessions::{Expiry, MemoryStore, SessionManagerLayer},
};
use sqlx::{Pool, Postgres, postgres::PgPoolOptions};
use tokio::net::TcpListener;
use tower_http::services::{ServeDir, ServeFile};

use crate::{
    app::resources::{
        categories_shops::{Category, Shop},
        oneoff_transactions::OneoffTransaction,
        recurring_transactions::RecurringTransaction,
    },
    build_routes,
    users::Backend,
};
mod api;
mod auth;
mod resources;
mod transactions;

pub struct App {
    state: AppState,
}

#[derive(Clone)]
struct AppState {
    database: Pool<Postgres>,
}

/// Read a value from an env var, or if `{name}_FILE` is set, read the file contents instead.
/// The `_FILE` variant takes precedence (for Docker secrets).
fn env_var_or_file(name: &str) -> Option<String> {
    let file_key = format!("{name}_FILE");
    if let Ok(path) = env::var(&file_key) {
        Some(fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("failed to read {file_key}={path}: {e}"))
            .trim()
            .to_string())
    } else {
        env::var(name).ok()
    }
}

fn build_database_url() -> anyhow::Result<String> {
    if let Ok(url) = env::var("DATABASE_URL") {
        return Ok(url);
    }

    let host = env::var("DB_HOST").unwrap_or_else(|_| "localhost".to_string());
    let database = env::var("DB_DATABASE").context("either DATABASE_URL or DB_DATABASE must be set")?;
    let user = env_var_or_file("DB_USER").context("DB_USER or DB_USER_FILE must be set when using DB_DATABASE")?;
    let password = env_var_or_file("DB_PASSWORD").context("DB_PASSWORD or DB_PASSWORD_FILE must be set when using DB_DATABASE")?;

    Ok(format!("postgres://{user}:{password}@{host}/{database}"))
}

impl App {
    pub async fn new() -> anyhow::Result<App> {
        let database_url = build_database_url()?;
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self {
            state: AppState { database: pool },
        })
    }

    #[cfg(test)]
    fn from_pool(database: Pool<Postgres>) -> Self {
        Self {
            state: AppState { database },
        }
    }

    fn router(&self) -> Router {
        let session_store = MemoryStore::default();
        let session_layer = SessionManagerLayer::new(session_store)
            .with_http_only(true)
            .with_secure(true)
            .with_path("/api")
            .with_expiry(Expiry::OnInactivity(auth::SESSION_MAX_AGE));

        let auth_layer =
            AuthManagerLayerBuilder::new(Backend::new(self.state.database.clone()), session_layer)
                .build();

        Router::new()
            .nest(
                "/api",
                Router::new()
                    .nest("/categories", build_routes!(Category))
                    .nest("/shops", build_routes!(Shop))
                    .nest("/transactions/oneoff", build_routes!(OneoffTransaction))
                    .nest(
                        "/transactions/recurring",
                        build_routes!(RecurringTransaction),
                    ),
            )
            .with_state(self.state.clone())
            .route_layer(login_required!(Backend))
            // The login_required macro above doesn't affect the auth routes, this module manually manages their routes
            .nest("/api/auth", auth::router())
            .route_layer(auth_layer)
            .fallback_service(
                ServeDir::new("static").fallback(ServeFile::new("static/index.html")),
            )
    }

    pub async fn serve(self) -> anyhow::Result<()> {
        let listener = TcpListener::bind("0.0.0.0:8080").await?;
        log::info!("App listening on 0.0.0.0:8080");
        axum::serve(listener, self.router()).await?;

        Ok(())
    }
}
