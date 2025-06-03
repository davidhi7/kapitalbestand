use axum::http::StatusCode;
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Postgres, QueryBuilder};
use validator::Validate;

use crate::app::api::json_field::JsonField;
use crate::app::categories_shops::{Category, Shop};
use crate::app::resource::Resource;
use crate::errors::ServerError;
use crate::users::User;

#[derive(Clone, Debug, Default, Deserialize)]
enum Ordering {
    #[default]
    Asc,
    Desc,
}

#[derive(Clone, Debug, Default, Deserialize)]
enum OrderKey {
    #[default]
    Time,
    Amount,
    Category,
    Shop,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(transparent)]
pub struct UnvalidatedCategoryId(i32);

impl UnvalidatedCategoryId {
    async fn validate(self, user: &User, database: &PgPool) -> Result<i32, ServerError> {
        match Category::get_by_id(database, user, self.0).await? {
            Some(_) => Ok(self.0),
            None => Err(ServerError::Generic(
                StatusCode::BAD_REQUEST,
                Some("Invalid category id".to_owned()),
            )),
        }
    }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(transparent)]
pub struct UnvalidatedShopId(i32);

impl UnvalidatedShopId {
    async fn validate(self, user: &User, database: &PgPool) -> Result<i32, ServerError> {
        match Shop::get_by_id(database, user, self.0).await? {
            Some(_) => Ok(self.0),
            None => Err(ServerError::Generic(
                StatusCode::BAD_REQUEST,
                Some("Invalid shop id".to_owned()),
            )),
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct OneoffTransaction {
    id: i32,
    date: NaiveDate,
    user_id: i32,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    is_expense: bool,
    amount: i32,
    description: Option<String>,
    category_id: i32,
    shop_id: Option<i32>,
}

#[derive(Clone, Debug, Deserialize, Validate)]
pub struct OneoffTransactionCreateParams {
    date: NaiveDate,
    is_expense: bool,
    amount: u32,
    description: Option<String>,
    category_id: UnvalidatedCategoryId,
    shop_id: Option<UnvalidatedShopId>,
}

#[derive(Clone, Debug, Deserialize, Validate)]
pub struct OneoffTransactionQueryParams {
    is_expense: Option<bool>,
    date_from: Option<NaiveDate>,
    date_to: Option<NaiveDate>,
    amount_from: Option<i32>,
    amount_to: Option<i32>,
    category_id: Option<UnvalidatedCategoryId>,
    shop_id: Option<UnvalidatedShopId>,
    #[serde(default)]
    ordering: Ordering,
    #[serde(default)]
    order_key: OrderKey,
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct OneoffTransactionUpdateParams {
    date: Option<NaiveDate>,
    is_expense: Option<bool>,
    amount: Option<u32>,
    description: JsonField<String>,
    category_id: Option<UnvalidatedCategoryId>,
    shop_id: JsonField<UnvalidatedShopId>,
}

impl Resource for OneoffTransaction {
    type CreateParams = OneoffTransactionCreateParams;
    type FetchParams = OneoffTransactionQueryParams;
    type UpdateParams = OneoffTransactionUpdateParams;
    type ReturnType = serde_json::Value;
    type VecReturnType = serde_json::Value;
    type Error = ServerError;

    async fn create(
        database: &sqlx::PgPool,
        user: &User,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        let result = sqlx::query_as!(OneoffTransaction, r#"
            INSERT INTO oneoff_transactions (date, user_id, is_expense, amount, description, category_id, shop_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        "#,
            params.date,
            user.id,
            params.is_expense,
            params.amount as i32,
            params.description,
            params.category_id.validate(&user, database).await?,
            match params.shop_id {
                Some(value) => Some(value.validate(user, database).await?),
                None => None,
            })
        .fetch_optional(database)
        .await?;

        let Some(instance) = result else {
            return Ok(None);
        };

        Self::get_by_id(database, user, instance.id).await
    }

    async fn fetch(
        database: &sqlx::PgPool,
        user: &User,
        params: Self::FetchParams,
        pagination: super::api::Pagination,
    ) -> Result<Self::VecReturnType, Self::Error> {
        let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
                WITH data AS (
                    SELECT ot.*,
                        row_to_json(c.*) as category,
                        row_to_json(s.*) as shop
                    FROM oneoff_transactions ot
                    INNER JOIN categories c ON ot.category_id = c.id
                    LEFT JOIN shops s ON ot.shop_id = s.id
                    WHERE ot.user_id = 
        "#,
        );
        query_builder.push_bind(user.id);

        if let Some(value) = params.is_expense {
            query_builder.push(" AND ot.is_expense = ").push_bind(value);
        }

        if let Some(date_from) = params.date_from {
            query_builder.push(" AND ot.date >= ").push_bind(date_from);
        }

        if let Some(date_to) = params.date_to {
            query_builder.push(" AND ot.date <= ").push_bind(date_to);
        }

        if let Some(amount_from) = params.amount_from {
            query_builder
                .push(" AND ot.amount >= ")
                .push_bind(amount_from);
        }

        if let Some(amount_to) = params.amount_to {
            query_builder
                .push(" AND ot.amount <= ")
                .push_bind(amount_to);
        }

        if let Some(category_id) = params.category_id {
            query_builder
                .push(" AND ot.category_id = ")
                .push_bind(category_id.validate(user, database).await?);
        }

        if let Some(shop_id) = params.shop_id {
            query_builder
                .push(" AND ot.shop_id = ")
                .push_bind(shop_id.validate(user, database).await?);
        }

        // Handle ordering
        query_builder.push(" ORDER BY ");

        match params.order_key {
            OrderKey::Time => query_builder.push("date"),
            OrderKey::Amount => query_builder.push("amount"),
            OrderKey::Category => query_builder.push("(category->>'name')"),
            OrderKey::Shop => query_builder.push("(shop->>'name')"),
        };

        match params.ordering {
            Ordering::Asc => query_builder.push(" ASC, id ASC"),
            Ordering::Desc => query_builder.push(" DESC, id DESC"),
        };

        query_builder
            .push(" LIMIT ")
            .push_bind(pagination.limit.0 as i32);
        query_builder
            .push(" OFFSET ")
            .push_bind(pagination.offset.0 as i32);

        // Close the CTE and add the main SELECT
        // `json_agg` returns null when applied to an empty set of rows, so use COALESCE
        query_builder.push(
            r#"
            )
            SELECT COALESCE(json_agg(row_to_json(data.*)), '[]'::json)
            FROM data
            "#,
        );

        let result: serde_json::Value = query_builder
            .build_query_scalar()
            .fetch_one(database)
            .await?;

        Ok(result)
    }

    async fn get_by_id(
        database: &sqlx::PgPool,
        user: &User,
        id: i32,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        let result = sqlx::query_scalar!(
            r#"
            WITH data AS (
                SELECT ot.*,
                    row_to_json(c.*) as category,
                    row_to_json(s.*) as shop
                FROM oneoff_transactions ot
                INNER JOIN categories c ON ot.category_id = c.id
                LEFT JOIN shops s ON ot.shop_id = s.id
                WHERE ot.user_id = $1 AND ot.id = $2
            )
            SELECT row_to_json(data.*)
            FROM data
            "#,
            user.id,
            id,
        )
        .fetch_optional(database)
        .await?;

        Ok(result.map(|optional_json| optional_json.expect("json_build_object returned NULL")))
    }

    async fn update(
        database: &sqlx::PgPool,
        user: &User,
        id: i32,
        params: Self::UpdateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        // Start building the dynamic query
        let mut query_parts = Vec::new();
        let mut bind_count = 1;

        // Build SET clause dynamically based on provided parameters
        // Note that no actual values are inserted at this point
        if params.date.is_some() {
            query_parts.push(format!("date = ${bind_count}"));
            bind_count += 1;
        }

        if params.is_expense.is_some() {
            query_parts.push(format!("is_expense = ${bind_count}"));
            bind_count += 1;
        }

        if params.amount.is_some() {
            query_parts.push(format!("amount = ${bind_count}"));
            bind_count += 1;
        }

        if let JsonField::Defined(_) = params.description {
            query_parts.push(format!("description = ${bind_count}"));
            bind_count += 1;
        }

        if params.category_id.is_some() {
            query_parts.push(format!("category_id = ${bind_count}"));
            bind_count += 1;
        }

        if let JsonField::Defined(_) = params.shop_id {
            query_parts.push(format!("shop_id = ${bind_count}"));
            bind_count += 1;
        }

        // If no fields to update, return instance without changes
        if query_parts.is_empty() {
            return Self::get_by_id(database, user, id).await;
        }

        // Build the complete SQL query
        let sql = format!(
            "UPDATE oneoff_transactions SET {} WHERE user_id = ${} AND id = ${}",
            query_parts.join(", "),
            bind_count,
            bind_count + 1
        );

        // Start building the query with sqlx
        let mut query = sqlx::query(&sql);

        // Bind parameters in the same order as they were added to query_parts
        if let Some(date) = params.date {
            query = query.bind(date);
        }

        if let Some(is_expense) = params.is_expense {
            query = query.bind(is_expense);
        }

        if let Some(amount) = params.amount {
            query = query.bind(amount as i32);
        }

        if let JsonField::Defined(field) = params.description {
            query = query.bind(field);
        }

        if let Some(category_id) = params.category_id {
            query = query.bind(category_id.validate(user, database).await?);
        }

        if let JsonField::Defined(field) = params.shop_id {
            query = query.bind(match field {
                Some(value) => Some(value.validate(user, database).await?),
                None => None,
            });
        }

        // Bind the WHERE clause parameters
        query = query.bind(user.id).bind(id);

        // Execute the query
        let result = query.execute(database).await?;

        if result.rows_affected() == 0 {
            Ok(None)
        } else {
            Self::get_by_id(database, user, id).await
        }
    }

    async fn remove(database: &sqlx::PgPool, user: &User, id: i32) -> Result<u64, Self::Error> {
        let result = sqlx::query!(
            "DELETE FROM oneoff_transactions WHERE user_id = $1 AND id = $2",
            user.id,
            id
        )
        .execute(database)
        .await?;

        Ok(result.rows_affected())
    }
}
