use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::Serialize;
use serde_json::json;
use sqlx::PgPool;

use crate::{
    app::{
        AppState,
        api::{AuthUser, Pagination, ValidJson, ValidQuery},
    },
    errors::ServerError,
    users::User,
};

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
    Query(pagination): Query<Pagination>,
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
        Router::new()
            .route(
                "/",
                axum::routing::post($crate::app::resource::create::<$type>),
            )
            .route(
                "/",
                axum::routing::get($crate::app::resource::fetch::<$type>),
            )
            .route(
                "/{id}",
                axum::routing::get($crate::app::resource::get_by_id::<$type>),
            )
            .route(
                "/{id}",
                axum::routing::patch($crate::app::resource::update::<$type>),
            )
            .route(
                "/{id}",
                axum::routing::delete($crate::app::resource::remove::<$type>),
            )
    }};
}
