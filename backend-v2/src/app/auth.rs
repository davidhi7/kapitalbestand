use axum::{
    Json, Router,
    extract::{FromRequest, Request, rejection::JsonRejection},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
};
use axum_login::{
    AuthSession, login_required,
    tower_sessions::{Session, cookie::time::Duration},
};
use serde::de::DeserializeOwned;
use serde_json::json;
use validator::Validate;

use crate::{
    errors::ServerError,
    users::{Backend, LoginCredentials, RegisterCredentials},
};

pub const SESSION_MAX_AGE: Duration = Duration::minutes(1);

#[derive(Debug, Clone, Copy, Default)]
pub struct ValidJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = ServerError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = Json::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(ValidJson(value))
    }
}

pub fn router() -> Router {
    Router::new()
        .route("/logout", get(logout))
        .route("/whoami", get(whoami))
        .route_layer(login_required!(Backend))
        .route("/login", post(login))
        .route("/register", post(register))
}

fn collect_session_info<'a>(username: String, session: &'a Session) -> impl IntoResponse + use<> {
    let timeout = session.expiry_date().to_utc().unix_timestamp();
    Json(json!(
        {
            "status": "success",
            "data": {
                "username": username,
                "sessionTimeout": timeout
            }
        }
    ))
}

pub async fn login(
    mut auth_session: AuthSession<Backend>,
    session: Session,
    ValidJson(credentials): ValidJson<LoginCredentials>,
) -> Result<impl IntoResponse, ServerError> {
    auth_session.logout().await?;
    session.cycle_id().await?;

    let Some(user) = auth_session.authenticate(credentials).await? else {
        return Err(StatusCode::FORBIDDEN.into());
    };

    auth_session.login(&user).await?;
    Ok((
        StatusCode::OK,
        collect_session_info(user.username, &session),
    ))
}

pub async fn register(
    mut auth_session: AuthSession<Backend>,
    session: Session,
    ValidJson(credentials): ValidJson<RegisterCredentials>,
) -> Result<impl IntoResponse, ServerError> {
    auth_session.logout().await?;
    session.cycle_id().await?;

    let Some(user) = auth_session.backend.create_user(credentials).await? else {
        return Err(StatusCode::FORBIDDEN.into());
    };

    auth_session.login(&user).await?;
    Ok((
        StatusCode::CREATED,
        collect_session_info(user.username, &session),
    ))
}

pub async fn logout(
    mut auth_session: AuthSession<Backend>,
) -> Result<impl IntoResponse, ServerError> {
    auth_session.logout().await?;

    Ok(Json(json!({"status": "success"})))
}

pub async fn whoami(
    auth_session: AuthSession<Backend>,
    session: Session,
) -> Result<impl IntoResponse, ServerError> {
    let Some(user) = auth_session.user else {
        return Err(StatusCode::UNAUTHORIZED.into());
    };

    session.set_expiry(Some(axum_login::tower_sessions::Expiry::OnInactivity(
        SESSION_MAX_AGE,
    )));
    Ok(collect_session_info(user.username, &session))
}

#[cfg(test)]
mod tests {
    use anyhow::{Context, Ok, Result};
    use axum::{
        Router,
        body::Body,
        http::{Request, StatusCode},
    };

    use http_body_util::BodyExt;
    use regex::Regex;
    use serde_json::{Value, json};
    use sqlx::{Pool, Postgres};
    use tower::ServiceExt;

    use crate::{
        app::App,
        users::{Backend, RegisterCredentials},
    };

    async fn count_users(db: &Pool<Postgres>) -> Result<i64> {
        sqlx::query_scalar!("SELECT COUNT(*) FROM users")
            .fetch_one(db)
            .await?
            .context("Failed to count users")
    }

    #[sqlx::test]
    async fn test_no_cookie_if_unauthenticated(db: Pool<Postgres>) -> anyhow::Result<()> {
        let app = App::from_pool(db).router();

        let response = app
            .oneshot(Request::get("/api/auth/whoami").body(Body::empty())?)
            .await?;

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);

        // Check that no Set-Cookie header is present
        let headers = response.headers();
        assert!(
            !headers.contains_key("set-cookie"),
            "Expected no Set-Cookie header to prevent session fixation"
        );
        Ok(())
    }

    #[sqlx::test]
    async fn test_register_creates_user_and_sets_cookie(db: Pool<Postgres>) -> anyhow::Result<()> {
        let app = App::from_pool(db.clone()).router();

        let response = app
            .oneshot(
                Request::post("/api/auth/register")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        json!({
                            "username": "username",
                            "password": "12345678"
                        })
                        .to_string(),
                    ))?,
            )
            .await?;

        assert_eq!(response.status(), StatusCode::CREATED);

        let headers = response.headers();
        assert!(
            headers.contains_key("set-cookie"),
            "Expected session cookie to be set"
        );

        let body: Value =
            serde_json::from_slice(&response.into_body().collect().await?.to_bytes())?;

        assert_eq!(body["status"], "success");
        assert_eq!(body["data"]["username"], "username");
        assert_eq!(count_users(&db).await?, 1);
        Ok(())
    }

    #[sqlx::test]
    async fn test_register_fails_if_password_too_short(db: Pool<Postgres>) -> anyhow::Result<()> {
        let app = App::from_pool(db.clone()).router();

        let response = app
            .oneshot(
                Request::post("/api/auth/register")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        json!({
                            "username": "username",
                            "password": "1234567"
                        })
                        .to_string(),
                    ))?,
            )
            .await?;

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert_eq!(count_users(&db).await?, 0);
        Ok(())
    }

    #[sqlx::test]
    async fn test_register_fails_if_username_or_password_missing(db: Pool<Postgres>) -> Result<()> {
        let app = App::from_pool(db.clone()).router();

        let req = Request::post("/api/auth/register")
            .header("content-type", "application/json")
            .body(Body::from(json!({ "password": "123456790" }).to_string()))?;

        let response = app.clone().oneshot(req).await?;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let req = Request::post("/api/auth/register")
            .header("content-type", "application/json")
            .body(Body::from(json!({ "username": "username" }).to_string()))?;

        let response = app.oneshot(req).await?;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        assert_eq!(count_users(&db).await?, 0);
        Ok(())
    }

    #[sqlx::test]
    async fn test_register_fails_if_username_taken(db: Pool<Postgres>) -> anyhow::Result<()> {
        Backend::new(db.clone())
            .create_user(RegisterCredentials {
                username: "username".into(),
                password: "test".into(),
            })
            .await?;

        let app = App::from_pool(db.clone()).router();

        let response = app
            .oneshot(
                Request::post("/api/auth/register")
                    .header("content-type", "application/json")
                    .body(Body::from(
                        json!({ "username": "username", "password": "123456790" }).to_string(),
                    ))?,
            )
            .await?;

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(count_users(&db).await?, 1);
        Ok(())
    }

    #[sqlx::test]
    async fn test_session_id_changes_when_registering_again(
        db: Pool<Postgres>,
    ) -> anyhow::Result<()> {
        async fn register_fetch_cookie(
            app: Router,
            username: &str,
            cookie: Option<String>,
        ) -> anyhow::Result<String> {
            let mut req =
                Request::post("/api/auth/register").header("content-type", "application/json");
            if let Some(c) = cookie {
                req = req.header("Cookie", c);
            }

            let response = app
                .clone()
                .oneshot(req.body(Body::from(
                    json!({"username": username, "password": "password"}).to_string(),
                ))?)
                .await?;
            assert_eq!(response.status(), StatusCode::CREATED);

            let session_header = response
                .headers()
                .get("set-cookie")
                .expect("No session cookie on first register");
            let cookie = &Regex::new(r"^(id=[^;]+)")?
                .captures(session_header.to_str()?)
                .expect("Regex error")[1];

            Ok(String::from(cookie))
        }

        let app = App::from_pool(db).router();

        let first_cookie = register_fetch_cookie(app.clone(), "username1", None).await?;
        let second_cookie =
            register_fetch_cookie(app.clone(), "username2", Some(first_cookie.clone())).await?;

        assert_ne!(first_cookie, second_cookie);

        let response = app
            .clone()
            .oneshot(
                Request::get("/api/auth/whoami")
                    .header("Cookie", second_cookie)
                    .body(Body::empty())?,
            )
            .await?;

        let body = response.into_body().collect().await?.to_bytes();

        let parsed: Value = serde_json::from_slice(&body).unwrap();
        println!("{:?}", parsed);

        assert_eq!(parsed["data"]["username"], "username2");

        Ok(())
    }

    #[sqlx::test]
    async fn test_session_id_changes_when_login_again(db: Pool<Postgres>) -> anyhow::Result<()> {
        let backend = Backend::new(db.clone());
        backend
            .create_user(RegisterCredentials {
                username: "username1".to_string(),
                password: "password".to_string(),
            })
            .await?;
        backend
            .create_user(RegisterCredentials {
                username: "username2".to_string(),
                password: "password".to_string(),
            })
            .await?;

        async fn login_fetch_cookie(
            app: Router,
            username: &str,
            cookie: Option<String>,
        ) -> anyhow::Result<String> {
            let mut req =
                Request::post("/api/auth/login").header("content-type", "application/json");
            if let Some(c) = cookie {
                req = req.header("Cookie", c);
            }

            let response = app
                .clone()
                .oneshot(req.body(Body::from(
                    json!({"username": username, "password": "password"}).to_string(),
                ))?)
                .await?;
            assert_eq!(response.status(), StatusCode::OK);

            let session_header = response
                .headers()
                .get("set-cookie")
                .expect("No session cookie on first register");
            let cookie = &Regex::new(r"^(id=[^;]+)")?
                .captures(session_header.to_str()?)
                .expect("Regex error")[1];

            Ok(String::from(cookie))
        }

        let app = App::from_pool(db).router();

        let first_cookie = login_fetch_cookie(app.clone(), "username1", None).await?;
        let second_cookie =
            login_fetch_cookie(app.clone(), "username2", Some(first_cookie.clone())).await?;

        assert_ne!(first_cookie, second_cookie);

        let response = app
            .clone()
            .oneshot(
                Request::get("/api/auth/whoami")
                    .header("Cookie", second_cookie)
                    .body(Body::empty())?,
            )
            .await?;

        let body = response.into_body().collect().await?.to_bytes();

        let parsed: Value = serde_json::from_slice(&body).unwrap();
        println!("{:?}", parsed);

        assert_eq!(parsed["data"]["username"], "username2");

        Ok(())
    }
}
