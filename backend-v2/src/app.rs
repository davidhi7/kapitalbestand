use axum::Router;
use axum_login::{
    AuthManagerLayerBuilder,
    tower_sessions::{Expiry, MemoryStore, SessionManagerLayer},
};
use sqlx::{Pool, Postgres, postgres::PgPoolOptions};
use tokio::net::TcpListener;

use crate::users::Backend;
mod auth;

pub struct App {
    database: Pool<Postgres>,
}

impl App {
    pub async fn new() -> anyhow::Result<App> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect("postgres://test:test@localhost/kapitalbestand-dev")
            .await?;

        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { database: pool })
    }

    #[cfg(test)]
    fn from_pool(database: Pool<Postgres>) -> Self {
        App { database }
    }

    fn router(&self) -> Router {
        let session_store = MemoryStore::default();
        let session_layer = SessionManagerLayer::new(session_store)
            .with_http_only(true)
            .with_secure(true)
            .with_path("/api")
            .with_expiry(Expiry::OnInactivity(auth::SESSION_MAX_AGE));

        let auth_layer =
            AuthManagerLayerBuilder::new(Backend::new(self.database.clone()), session_layer)
                .build();

        Router::new()
            .nest("/api/auth", auth::router())
            .route_layer(auth_layer)
    }

    pub async fn serve(self) -> anyhow::Result<()> {
        let listener = TcpListener::bind("localhost:8080").await?;
        axum::serve(listener, self.router()).await?;

        Ok(())
    }
}
