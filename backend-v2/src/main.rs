use tracing_subscriber::EnvFilter;

use crate::app::App;
mod app;
mod errors;
mod users;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    dotenv::dotenv().ok();

    let app = App::new().await?;
    app.serve().await?;

    Ok(())
}
