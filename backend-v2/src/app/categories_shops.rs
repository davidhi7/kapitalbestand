use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, patch, post},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::{PgPool, Postgres, QueryBuilder, prelude::FromRow};
use validator::Validate;

use crate::{
    app::{
        AppState,
        api::{AuthUser, Pagination, ValidJson, ValidQuery},
    },
    errors::ServerError,
    users::User,
};

pub trait Resource: Sized + Serialize {
    type CreateParams;
    type FetchParams;
    type UpdateParams;
    type Error: Into<ServerError>;

    async fn create(
        database: &PgPool,
        user: User,
        params: Self::CreateParams,
    ) -> Result<Option<Self>, Self::Error>;

    async fn fetch(
        database: &PgPool,
        user: User,
        params: Self::FetchParams,
        pagination: Pagination,
    ) -> Result<Vec<Self>, Self::Error>;

    async fn get_by_id(database: &PgPool, user: User, id: i32)
    -> Result<Option<Self>, Self::Error>;

    async fn update(
        database: &PgPool,
        user: User,
        id: i32,
        params: Self::UpdateParams,
    ) -> Result<Option<Self>, Self::Error>;

    async fn remove(database: &PgPool, user: User, id: i32) -> Result<u64, Self::Error>;
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CategoryShopCreate {
    #[validate(length(min = 1))]
    name: String,
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct CategoryShopFetch {
    #[validate(length(min = 1))]
    name: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Category {
    pub id: i32,
    pub name: String,
    pub user_id: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Resource for Category {
    type CreateParams = CategoryShopCreate;
    type FetchParams = CategoryShopFetch;
    type UpdateParams = CategoryShopCreate;
    type Error = sqlx::Error;

    async fn create(
        database: &PgPool,
        user: User,
        params: Self::CreateParams,
    ) -> Result<Option<Self>, Self::Error> {
        // macro query_as! doesn't work here?
        sqlx::query_as(
            "INSERT INTO categories (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
        ).bind(user.id).bind(params.name)
        .fetch_optional(database)
        .await
    }

    async fn fetch(
        database: &PgPool,
        user: User,
        params: Self::FetchParams,
        Pagination { limit, offset }: Pagination,
    ) -> Result<Vec<Self>, Self::Error> {
        let mut builder: QueryBuilder<Postgres> =
            QueryBuilder::new("SELECT * FROM categories WHERE user_id = ");
        builder.push_bind(user.id);

        if let Some(name) = params.name {
            builder.push(" AND name = ").push_bind(name);
        }

        builder
            .push(" LIMIT ")
            .push_bind(limit as i32)
            .push(" OFFSET ")
            .push_bind(offset as i32);

        builder.build_query_as().fetch_all(database).await
    }

    async fn get_by_id(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
    ) -> Result<Option<Self>, Self::Error> {
        sqlx::query_as("SELECT * FROM categories WHERE user_id = $1 AND id = $2")
            .bind(user.id)
            .bind(id)
            .fetch_optional(database)
            .await
    }

    async fn update(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
        params: Self::CreateParams,
    ) -> Result<Option<Self>, Self::Error> {
        sqlx::query_as("UPDATE categories SET name = $3 WHERE user_id = $1 AND id = $2 RETURNING *")
            .bind(user.id)
            .bind(id)
            .bind(params.name)
            .fetch_optional(database)
            .await
    }

    async fn remove(database: &sqlx::PgPool, user: User, id: i32) -> Result<u64, Self::Error> {
        sqlx::query_as!(
            Category,
            "DELETE FROM categories WHERE user_id = $1 AND id = $2",
            user.id,
            id
        )
        .execute(database)
        .await
        .map(|result| result.rows_affected())
    }
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct Shop {
    pub id: i32,
    pub name: String,
    pub user_id: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Resource for Shop {
    type CreateParams = CategoryShopCreate;
    type FetchParams = CategoryShopFetch;
    type UpdateParams = CategoryShopCreate;
    type Error = sqlx::Error;

    async fn create(
        database: &PgPool,
        user: User,
        params: Self::CreateParams,
    ) -> Result<Option<Self>, Self::Error> {
        sqlx::query_as(
            "INSERT INTO shops (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
        )
        .bind(user.id)
        .bind(params.name)
        .fetch_optional(database)
        .await
    }

    async fn fetch(
        database: &PgPool,
        user: User,
        params: Self::FetchParams,
        Pagination { limit, offset }: Pagination,
    ) -> Result<Vec<Self>, Self::Error> {
        let mut builder: QueryBuilder<Postgres> =
            QueryBuilder::new("SELECT * FROM shops WHERE user_id = ");
        builder.push_bind(user.id);

        if let Some(name) = params.name {
            builder.push(" AND name = ").push_bind(name);
        }

        builder
            .push(" LIMIT ")
            .push_bind(limit as i32)
            .push(" OFFSET ")
            .push_bind(offset as i32);

        builder.build_query_as().fetch_all(database).await
    }

    async fn get_by_id(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
    ) -> Result<Option<Self>, Self::Error> {
        sqlx::query_as("SELECT * FROM shops WHERE user_id = $1 AND id = $2")
            .bind(user.id)
            .bind(id)
            .fetch_optional(database)
            .await
    }

    async fn update(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
        params: Self::CreateParams,
    ) -> Result<Option<Self>, Self::Error> {
        sqlx::query_as("UPDATE shops SET name = $3 WHERE user_id = $1 AND id = $2 RETURNING *")
            .bind(user.id)
            .bind(id)
            .bind(params.name)
            .fetch_optional(database)
            .await
    }

    async fn remove(database: &sqlx::PgPool, user: User, id: i32) -> Result<u64, Self::Error> {
        sqlx::query_as!(
            Shop,
            "DELETE FROM shops WHERE user_id = $1 AND id = $2",
            user.id,
            id
        )
        .execute(database)
        .await
        .map(|result| result.rows_affected())
    }
}

async fn create<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    ValidJson(params): ValidJson<T::CreateParams>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
{
    let result = T::create(&state.database, user, params).await?;

    let Some(instance) = result else {
        return Err(ServerError::Generic(StatusCode::BAD_REQUEST));
    };

    Ok((
        StatusCode::CREATED,
        Json(json!({ "status": "success", "data": instance })),
    ))
}

async fn fetch<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Query(pagination): Query<Pagination>,
    ValidQuery(params): ValidQuery<T::FetchParams>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
{
    let result = T::fetch(&state.database, user, params, pagination).await?;

    Ok(Json(json!({ "status": "success", "data": result })))
}

async fn get_by_id<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<u32>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
{
    let result = T::get_by_id(&state.database, user, id as i32).await?;

    let Some(instance) = result else {
        return Err(ServerError::Generic(StatusCode::NOT_FOUND));
    };

    Ok(Json(json!({ "status": "success", "data": instance })))
}

async fn update<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<u32>,
    ValidJson(params): ValidJson<T::UpdateParams>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
{
    let result = T::update(&state.database, user, id as i32, params).await?;

    let Some(instance) = result else {
        return Err(ServerError::Generic(StatusCode::NOT_FOUND));
    };

    Ok((Json(json!( { "status": "success", "data": instance } )),))
}

async fn remove<T: Resource>(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(id): Path<u32>,
) -> Result<impl IntoResponse, ServerError>
where
    ServerError: From<T::Error>,
{
    let result = T::remove(&state.database, user, id as i32).await?;

    match result {
        0 => Err(ServerError::Generic(StatusCode::NOT_FOUND)),
        1 => Ok(Json(json!( { "status": "success" } ))),
        _ => panic!("More than 1 rows deleted in single request"),
    }
}
pub fn categories_router() -> Router<AppState> {
    Router::new()
        .route("/", post(create::<Category>))
        .route("/", get(fetch::<Category>))
        .route("/{id}", get(get_by_id::<Category>))
        .route("/{id}", patch(update::<Category>))
        .route("/{id}", delete(remove::<Category>))
}

pub fn shops_router() -> Router<AppState> {
    Router::new()
        .route("/", post(create::<Shop>))
        .route("/", get(fetch::<Shop>))
        .route("/{id}", get(get_by_id::<Shop>))
        .route("/{id}", patch(update::<Shop>))
        .route("/{id}", delete(remove::<Shop>))
}
