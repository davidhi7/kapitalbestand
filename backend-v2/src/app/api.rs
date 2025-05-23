use axum::{
    Json,
    extract::{
        FromRequest, FromRequestParts, OptionalFromRequest, Request, rejection::JsonRejection,
    },
    http::{StatusCode, request::Parts},
};
use serde::{Deserialize, de::DeserializeOwned};
use validator::Validate;

use crate::{app::auth::AuthSession, errors::ServerError, users::User};

fn default_limit() -> u32 {
    1000
}

#[derive(Clone, Copy, Debug, Deserialize, Validate)]
pub struct Pagination {
    #[serde(default = "default_limit")]
    pub limit: u32,
    #[serde(default)]
    pub offset: u32,
}

pub struct AuthUser(pub User);

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = ServerError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let session = match AuthSession::from_request_parts(parts, state).await {
            Ok(session) => session,
            // Probably an internal server error for when AuthSession can't be created
            Err(err) => {
                eprintln!("{}", err.1);
                return Err(ServerError::Generic(err.0));
            }
        };

        // If session.user is None, no user is logged in
        let Some(user) = session.user else {
            return Err(ServerError::Generic(StatusCode::UNAUTHORIZED));
        };

        Ok(AuthUser(user))
    }
}

#[derive(Debug, Clone, Default)]
pub struct ValidJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = ServerError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(value) = <Json<T> as FromRequest<S>>::from_request(req, state).await?;
        value.validate()?;
        Ok(ValidJson(value))
    }
}

impl<T, S> OptionalFromRequest<S> for ValidJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = ServerError;

    async fn from_request(req: Request, state: &S) -> Result<Option<Self>, Self::Rejection> {
        match <ValidJson<T> as FromRequest<S>>::from_request(req, state).await {
            Ok(value) => Ok(Some(value)),
            // If json is actually sent, we do check it and reject the request if it is malformed.
            // Only if content type is not set to json, we ignore this
            Err(ServerError::AxumJsonRejection(JsonRejection::MissingJsonContentType(_))) => {
                Ok(None)
            }
            Err(err) => Err(err),
        }
    }
}
