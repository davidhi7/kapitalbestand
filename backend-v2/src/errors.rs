use axum::{
    extract::rejection::JsonRejection,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use axum_login::tower_sessions::session;
use thiserror::Error;

use crate::users::{self, Backend};

#[derive(Debug, Error)]
pub enum ServerError {
    #[error(transparent)]
    ValidationError(#[from] validator::ValidationErrors),

    #[error(transparent)]
    AxumJsonRejection(#[from] JsonRejection),

    #[error(transparent)]
    AxumAuthError(#[from] axum_login::Error<Backend>),

    #[error("{:?}", .0.canonical_reason())]
    Generic(StatusCode),
}

impl IntoResponse for ServerError {
    fn into_response(self) -> Response {
        match self {
            ServerError::ValidationError(_) => {
                let message = format!("Input validation error: {self}");
                (StatusCode::BAD_REQUEST, message).into_response()
            }
            ServerError::AxumJsonRejection(_) => {
                let message = format!("Json format error: {self}");
                (StatusCode::BAD_REQUEST, message).into_response()
            }
            ServerError::AxumAuthError(_) => {
                eprintln!("{self:?}");
                (StatusCode::INTERNAL_SERVER_ERROR).into_response()
            }
            ServerError::Generic(status) => status.into_response(),
        }
    }
}

// `users::Error` is a subset of errors inside `ServerError::AxumAuthError`, so map it accordingly
impl From<users::Error> for ServerError {
    fn from(value: users::Error) -> Self {
        ServerError::AxumAuthError(axum_login::Error::Backend(value))
    }
}

// `session::Error` is a subset of errors inside `ServerError::AxumAuthError`, so map it accordingly
impl From<session::Error> for ServerError {
    fn from(value: session::Error) -> Self {
        ServerError::AxumAuthError(axum_login::Error::Session(value))
    }
}

impl From<StatusCode> for ServerError {
    fn from(value: StatusCode) -> Self {
        ServerError::Generic(value)
    }
}
