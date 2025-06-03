use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, QueryBuilder, prelude::FromRow};
use validator::Validate;

use crate::{
    app::{api::Pagination, resource::Resource},
    users::User,
};

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
    type ReturnType = Category;
    type VecReturnType = Vec<Self::ReturnType>;
    type Error = sqlx::Error;

    async fn create(
        database: &PgPool,
        user: User,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        let result = sqlx::query_as!(
            Category,
            "INSERT INTO categories (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *", user.id, params.name)
        .fetch_optional(database)
        .await;

        result
    }

    async fn fetch(
        database: &PgPool,
        user: User,
        params: Self::FetchParams,
        Pagination { limit, offset }: Pagination,
    ) -> Result<Self::VecReturnType, Self::Error> {
        let mut builder: QueryBuilder<Postgres> =
            QueryBuilder::new("SELECT * FROM categories WHERE user_id = ");
        builder.push_bind(user.id);

        if let Some(name) = params.name {
            builder.push(" AND name = ").push_bind(name);
        }

        builder
            .push(" LIMIT ")
            .push_bind(limit.0 as i32)
            .push(" OFFSET ")
            .push_bind(offset.0 as i32);

        builder
            .build_query_as::<Category>()
            .fetch_all(database)
            .await
    }

    async fn get_by_id(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE user_id = $1 AND id = $2",
            user.id,
            id
        )
        .fetch_optional(database)
        .await
    }

    async fn update(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        sqlx::query_as!(
            Category,
            "UPDATE categories SET name = $3 WHERE user_id = $1 AND id = $2 RETURNING *",
            user.id,
            id,
            params.name
        )
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
    type ReturnType = Shop;
    type VecReturnType = Vec<Self::ReturnType>;
    type Error = sqlx::Error;

    async fn create(
        database: &PgPool,
        user: User,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        sqlx::query_as!(
            Shop,
            "INSERT INTO shops (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *",
            user.id,
            params.name
        )
        .fetch_optional(database)
        .await
    }

    async fn fetch(
        database: &PgPool,
        user: User,
        params: Self::FetchParams,
        Pagination { limit, offset }: Pagination,
    ) -> Result<Self::VecReturnType, Self::Error> {
        let mut builder: QueryBuilder<Postgres> =
            QueryBuilder::new("SELECT * FROM shops WHERE user_id = ");
        builder.push_bind(user.id);

        if let Some(name) = params.name {
            builder.push(" AND name = ").push_bind(name);
        }

        builder
            .push(" LIMIT ")
            .push_bind(limit.0 as i32)
            .push(" OFFSET ")
            .push_bind(offset.0 as i32);

        builder.build_query_as::<Shop>().fetch_all(database).await
    }

    async fn get_by_id(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        sqlx::query_as!(
            Shop,
            "SELECT * FROM shops WHERE user_id = $1 AND id = $2",
            user.id,
            id
        )
        .fetch_optional(database)
        .await
    }

    async fn update(
        database: &sqlx::PgPool,
        user: User,
        id: i32,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        sqlx::query_as!(
            Shop,
            "UPDATE shops SET name = $3 WHERE user_id = $1 AND id = $2 RETURNING *",
            user.id,
            id,
            params.name
        )
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
