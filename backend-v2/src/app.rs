use std::env;

use anyhow::Context;
use axum::Router;
use axum_login::{
    AuthManagerLayerBuilder, login_required,
    tower_sessions::{Expiry, MemoryStore, SessionManagerLayer},
};
use sqlx::{Pool, Postgres, postgres::PgPoolOptions};
use tokio::net::TcpListener;

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

impl App {
    pub async fn new() -> anyhow::Result<App> {
        let database_url = env::var("DATABASE_URL").context("DATABASE_URL must be set")?;
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
    }

    pub async fn serve(self) -> anyhow::Result<()> {
        let listener = TcpListener::bind("localhost:8080").await?;
        log::info!("App listening to localhost:8080");
        axum::serve(listener, self.router()).await?;

        Ok(())
    }
}
