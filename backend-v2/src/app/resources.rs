use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Serialize;
use serde_json::json;
use sqlx::PgPool;

use crate::{
    app::{
        AppState,
        api::{AuthUser, ValidJson, ValidQuery, pagination::Pagination},
    },
    errors::ServerError,
    users::User,
};

pub mod categories_shops;
pub mod oneoff_transactions;
pub mod recurring_transactions;

pub trait Resource {
    type CreateParams;
    type FetchParams;
    type UpdateParams;
    type ReturnType;
    type VecReturnType;
    type Error: Into<ServerError>;

    async fn create(
        database: &PgPool,
        user: &User,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error>;

    async fn fetch(
        database: &PgPool,
        user: &User,
        params: Self::FetchParams,
        pagination: Pagination,
    ) -> Result<Self::VecReturnType, Self::Error>;

    async fn get_by_id(
        database: &PgPool,
        user: &User,
        id: i32,
    ) -> Result<Option<Self::ReturnType>, Self::Error>;

    async fn update(
        database: &PgPool,
        user: &User,
        id: i32,
        params: Self::UpdateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error>;

    async fn remove(database: &PgPool, user: &User, id: i32) -> Result<u64, Self::Error>;
}

pub async fn create<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    ValidJson(params): ValidJson<T::CreateParams>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
    T::ReturnType: Serialize,
{
    let result = T::create(&state.database, &user, params).await?;

    let Some(instance) = result else {
        return Err(ServerError::Generic(StatusCode::BAD_REQUEST, None));
    };

    Ok((
        StatusCode::CREATED,
        Json(json!({ "status": "success", "data": instance })),
    ))
}

pub async fn fetch<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    ValidQuery(pagination): ValidQuery<Pagination>,
    ValidQuery(params): ValidQuery<T::FetchParams>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
    T::VecReturnType: Serialize,
{
    let result = T::fetch(&state.database, &user, params, pagination).await?;

    Ok(Json(json!({ "status": "success", "data": result })))
}

pub async fn get_by_id<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<u32>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
    T::ReturnType: Serialize,
{
    let result = T::get_by_id(&state.database, &user, id as i32).await?;

    let Some(instance) = result else {
        return Err(ServerError::Generic(StatusCode::NOT_FOUND, None));
    };

    Ok(Json(json!({ "status": "success", "data": instance })))
}

pub async fn update<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<u32>,
    ValidJson(params): ValidJson<T::UpdateParams>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
    T::ReturnType: Serialize,
{
    let result = T::update(&state.database, &user, id as i32, params).await?;

    let Some(instance) = result else {
        return Err(ServerError::Generic(StatusCode::NOT_FOUND, None));
    };

    Ok((Json(json!( { "status": "success", "data": instance } )),))
}

pub async fn remove<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<u32>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
    T::ReturnType: Serialize,
{
    let result = T::remove(&state.database, &user, id as i32).await?;

    match result {
        1 => Ok(Json(json!( { "status": "success" } ))),
        0 => Err(ServerError::Generic(StatusCode::NOT_FOUND, None)),
        _ => panic!("More than 1 rows deleted in single request"),
    }
}

#[macro_export]
macro_rules! build_routes {
    ($type:ty) => {{
        use axum::routing::{delete, get, patch, post};
        use $crate::app::resources::{create, fetch, get_by_id, remove, update};

        Router::new()
            .route("/", post(create::<$type>))
            .route("/", get(fetch::<$type>))
            .route("/{id}", get(get_by_id::<$type>))
            .route("/{id}", patch(update::<$type>))
            .route("/{id}", delete(remove::<$type>))
    }};
}
