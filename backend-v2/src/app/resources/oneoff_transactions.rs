use std::ops::Deref;

use chrono::{DateTime, NaiveDate, Utc};
use garde::Validate;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Postgres, QueryBuilder};

use crate::app::api::json_field::JsonField;
use crate::app::api::pagination::Pagination;
use crate::app::resources::Resource;
use crate::app::transactions::{
    Amount, Description, OrderKey, Ordering, UnvalidatedCategoryId, UnvalidatedShopId,
};
use crate::errors::ServerError;
use crate::users::User;

#[derive(Clone, Debug, Serialize, FromRow, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
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
    category: String,
    shop_id: Option<i32>,
    shop: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Validate)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OneoffTransactionCreateParams {
    #[garde(skip)]
    date: NaiveDate,
    #[garde(skip)]
    is_expense: bool,
    #[garde(dive)]
    amount: Amount,
    #[garde(dive)]
    description: Option<Description>,
    #[garde(dive)]
    category_id: UnvalidatedCategoryId,
    #[garde(dive)]
    shop_id: Option<UnvalidatedShopId>,
}

#[derive(Clone, Debug, Default, Deserialize, Validate)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OneoffTransactionQueryParams {
    #[garde(skip)]
    is_expense: Option<bool>,
    #[garde(skip)]
    date_from: Option<NaiveDate>,
    #[garde(skip)]
    date_to: Option<NaiveDate>,
    #[garde(dive)]
    amount_from: Option<Amount>,
    #[garde(dive)]
    amount_to: Option<Amount>,
    #[garde(dive)]
    category_id: Option<UnvalidatedCategoryId>,
    #[garde(dive)]
    shop_id: JsonField<UnvalidatedShopId>,
    #[serde(default)]
    #[garde(skip)]
    ordering: Ordering,
    #[serde(default)]
    #[garde(skip)]
    order_key: OrderKey,
}

#[derive(Debug, Clone, Default, Deserialize, Validate)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OneoffTransactionUpdateParams {
    #[garde(skip)]
    date: Option<NaiveDate>,
    #[garde(skip)]
    is_expense: Option<bool>,
    #[garde(dive)]
    amount: Option<Amount>,
    #[garde(dive)]
    description: JsonField<Description>,
    #[garde(dive)]
    category_id: Option<UnvalidatedCategoryId>,
    #[garde(dive)]
    shop_id: JsonField<UnvalidatedShopId>,
}

impl Resource for OneoffTransaction {
    type CreateParams = OneoffTransactionCreateParams;
    type FetchParams = OneoffTransactionQueryParams;
    type UpdateParams = OneoffTransactionUpdateParams;
    type ReturnType = OneoffTransaction;
    type VecReturnType = Vec<OneoffTransaction>;
    type Error = ServerError;

    async fn create(
        database: &sqlx::PgPool,
        user: &User,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        let result = sqlx::query_as!(
            OneoffTransaction,
            r#"
            WITH insert AS (
                INSERT INTO oneoff_transactions (date, user_id, is_expense, amount, description, category_id, shop_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING *
            )
            SELECT insert.*, c.name as category, s.name as "shop?"
            FROM insert
            INNER JOIN categories c ON insert.category_id = c.id
            LEFT JOIN shops s ON insert.shop_id = s.id
            "#,
            params.date,
            user.id,
            params.is_expense,
            params.amount.deref(),
            params.description.as_deref(),
            params.category_id.validate(&user, database).await?,
            match params.shop_id {
                Some(value) => Some(value.validate(user, database).await?),
                None => None,
            })
        .fetch_optional(database)
        .await?;

        Ok(result)
    }

    async fn fetch(
        database: &sqlx::PgPool,
        user: &User,
        params: Self::FetchParams,
        pagination: Pagination,
    ) -> Result<Self::VecReturnType, Self::Error> {
        // "shop?" annotation is not needed in constrast to get_by_id which uses the macro
        let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
                SELECT
                    ot.*,
                    c.name as category,
                    s.name as shop
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
                .push_bind(*amount_from);
        }

        if let Some(amount_to) = params.amount_to {
            query_builder
                .push(" AND ot.amount <= ")
                .push_bind(*amount_to);
        }

        if let Some(category_id) = params.category_id {
            query_builder
                .push(" AND ot.category_id = ")
                .push_bind(category_id.validate(user, database).await?);
        }

        if let JsonField::Defined(Some(shop_id)) = params.shop_id {
            query_builder
                .push(" AND ot.shop_id = ")
                .push_bind(shop_id.validate(user, database).await?);
        } else if let JsonField::Defined(None) = params.shop_id {
            query_builder.push(" AND ot.shop_id IS NULL");
        }

        // Handle ordering
        query_builder.push(" ORDER BY ");

        match params.order_key {
            OrderKey::Time => query_builder.push("date"),
            OrderKey::Amount => query_builder.push("amount"),
            OrderKey::Category => query_builder.push("c.name"),
            OrderKey::Shop => query_builder.push("s.name"),
        };

        match params.ordering {
            Ordering::Asc => query_builder.push(" ASC, id ASC"),
            Ordering::Desc => query_builder.push(" DESC, id DESC"),
        };

        query_builder.push(" LIMIT ").push_bind(pagination.limit.0);
        query_builder
            .push(" OFFSET ")
            .push_bind(pagination.offset.0);

        let result: Vec<OneoffTransaction> =
            query_builder.build_query_as().fetch_all(database).await?;

        Ok(result)
    }

    async fn get_by_id(
        database: &sqlx::PgPool,
        user: &User,
        id: i32,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        // explicit annotation "shop?" is required to mark the shop column as nullable because sqlx doesn't understand left joins
        // https://github.com/launchbadge/sqlx/issues/367
        let result = sqlx::query_as!(
            OneoffTransaction,
            r#"
            SELECT ot.*, c.name as category, s.name as "shop?"
            FROM oneoff_transactions ot
            INNER JOIN categories c ON ot.category_id = c.id
            LEFT JOIN shops s ON ot.shop_id = s.id
            WHERE ot.user_id = $1 AND ot.id = $2
            "#,
            user.id,
            id
        )
        .fetch_optional(database)
        .await?;

        Ok(result)
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
            query = query.bind(*amount);
        }

        if let JsonField::Defined(field) = &params.description {
            query = query.bind(field.as_deref());
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

#[cfg(test)]
mod tests {
    use super::*;

    use sqlx::PgPool;

    use crate::{
        app::{
            api::pagination::{Limit, Offset},
            resources::categories_shops::{Category, Shop},
        },
        users::User,
    };

    async fn get_user_by_id(pool: &PgPool, id: i32) -> User {
        sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
            .fetch_one(pool)
            .await
            .expect("Failed to get user")
    }

    async fn get_category_by_name(pool: &PgPool, user_id: i32, name: &str) -> Category {
        sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE user_id = $1 AND name = $2 LIMIT 1",
            user_id,
            name
        )
        .fetch_one(pool)
        .await
        .expect("Failed to find category")
    }

    async fn get_shop_by_name(pool: &PgPool, user_id: i32, name: &str) -> Shop {
        sqlx::query_as!(
            Shop,
            "SELECT * FROM shops WHERE user_id = $1 AND name = $2 LIMIT 1",
            user_id,
            name
        )
        .fetch_one(pool)
        .await
        .expect("Failed to find shop")
    }

    async fn fetch_all_transactions_with_ordering(
        pool: &PgPool,
        user_id: i32,
        ordering: Ordering,
        order_key: OrderKey,
    ) -> anyhow::Result<Vec<OneoffTransaction>> {
        let result = OneoffTransaction::fetch(
            pool,
            &sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", user_id)
                .fetch_one(pool)
                .await?,
            OneoffTransactionQueryParams {
                ordering,
                order_key,
                ..Default::default()
            },
            Pagination::default(),
        )
        .await?;

        Ok(result)
    }

    // create tests
    #[sqlx::test(fixtures("base"))]
    fn test_create_instance(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let category = get_category_by_name(&pool, user.id, "Groceries").await;

        let result = OneoffTransaction::create(
            &pool,
            &user,
            OneoffTransactionCreateParams {
                date: NaiveDate::from_ymd_opt(2024, 12, 31).unwrap(),
                is_expense: true,
                amount: Amount(1),
                description: None,
                category_id: UnvalidatedCategoryId::from(category.id),
                shop_id: None,
            },
        )
        .await?
        .expect("Failed to create oneoff transaction");

        assert_eq!(result.date, NaiveDate::from_ymd_opt(2024, 12, 31).unwrap());
        assert!(result.is_expense);
        assert_eq!(result.amount, 1);
        assert_eq!(result.description, None);
        assert_eq!(result.category_id, category.id);
        assert_eq!(result.category, category.name);
        assert_eq!(result.shop_id, None);
        assert_eq!(result.shop, None);

        // Test that the instruction was created
        sqlx::query_scalar!(
            "SELECT id FROM oneoff_transactions WHERE id = $1",
            result.id
        )
        .fetch_one(&pool)
        .await?;

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    fn test_create_instance_with_shop(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let category = get_category_by_name(&pool, user.id, "Groceries").await;
        let shop = get_shop_by_name(&pool, user.id, "Whole Foods").await;

        let result = OneoffTransaction::create(
            &pool,
            &user,
            OneoffTransactionCreateParams {
                date: NaiveDate::from_ymd_opt(2024, 12, 31).unwrap(),
                is_expense: true,
                amount: Amount(1),
                description: None,
                category_id: UnvalidatedCategoryId::from(category.id),
                shop_id: Some(UnvalidatedShopId::from(shop.id)),
            },
        )
        .await?
        .expect("Failed to create oneoff transaction");

        assert_eq!(result.date, NaiveDate::from_ymd_opt(2024, 12, 31).unwrap());
        assert!(result.is_expense);
        assert_eq!(result.amount, 1);
        assert_eq!(result.description, None);
        assert_eq!(result.category_id, category.id);
        assert_eq!(result.category, category.name);
        assert_eq!(result.shop_id, Some(shop.id));
        assert_eq!(result.shop, Some(shop.name));
        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    fn test_create_invalid_category_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let instructions_before = sqlx::query_scalar!("SELECT COUNT(*) FROM oneoff_transactions")
            .fetch_one(&pool)
            .await?
            .expect("No count returned");

        OneoffTransaction::create(
            &pool,
            &user,
            OneoffTransactionCreateParams {
                date: NaiveDate::from_ymd_opt(2024, 12, 31).unwrap(),
                is_expense: true,
                amount: Amount(1),
                description: None,
                category_id: UnvalidatedCategoryId::from(999999),
                shop_id: None,
            },
        )
        .await
        .expect_err("Shouldn't create with invalid category id");

        OneoffTransaction::create(
            &pool,
            &user,
            OneoffTransactionCreateParams {
                date: NaiveDate::from_ymd_opt(2024, 12, 31).unwrap(),
                is_expense: true,
                amount: Amount(1),
                description: None,
                category_id: UnvalidatedCategoryId::from(16),
                shop_id: None,
            },
        )
        .await
        .expect_err("Shouldn't create with category id belonging to a different user");

        assert_eq!(
            sqlx::query_scalar!("SELECT COUNT(*) FROM oneoff_transactions")
                .fetch_one(&pool)
                .await?
                .expect("No count returned"),
            instructions_before
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    fn test_create_invalid_shop_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let category = get_category_by_name(&pool, user.id, "Groceries").await;

        let transactions_before = sqlx::query_scalar!("SELECT COUNT(*) FROM oneoff_transactions")
            .fetch_one(&pool)
            .await?
            .expect("No count returned");

        OneoffTransaction::create(
            &pool,
            &user,
            OneoffTransactionCreateParams {
                date: NaiveDate::from_ymd_opt(2024, 12, 31).unwrap(),
                is_expense: true,
                amount: Amount(1),
                description: None,
                category_id: UnvalidatedCategoryId::from(category.id),
                shop_id: Some(UnvalidatedShopId::from(999999)),
            },
        )
        .await
        .expect_err("Shouldn't create with invalid shop id");

        OneoffTransaction::create(
            &pool,
            &user,
            OneoffTransactionCreateParams {
                date: NaiveDate::from_ymd_opt(2024, 12, 31).unwrap(),
                is_expense: true,
                amount: Amount(1),
                description: None,
                category_id: UnvalidatedCategoryId::from(category.id),
                shop_id: Some(UnvalidatedShopId::from(16)),
            },
        )
        .await
        .expect_err("Shouldn't create with shop id belonging to a different user");

        assert_eq!(
            sqlx::query_scalar!("SELECT COUNT(*) FROM oneoff_transactions")
                .fetch_one(&pool)
                .await?
                .expect("No count returned"),
            transactions_before
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_all(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let result = OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams::default(),
            Pagination::default(),
        )
        .await?;

        assert_eq!(result.len(), 22);
        assert!(result.iter().all(|t| t.user_id == user.id));

        Ok(())
    }

    // fetch tests
    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_default_ordering(pool: PgPool) -> anyhow::Result<()> {
        let user: User = get_user_by_id(&pool, 1).await;
        let result = OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams::default(),
            Pagination::default(),
        )
        .await?;

        // Default ordering is date ASC, id ASC
        assert!(
            result
                .windows(2)
                .all(|w| w[0].date < w[1].date || (w[0].date == w[1].date && w[0].id < w[1].id))
        );
        assert!(result.iter().all(|t| t.user_id == user.id));

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_only_incomes(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = OneoffTransactionQueryParams {
            is_expense: Some(false),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All should be incomes
        assert!(result.iter().all(|t| !t.is_expense));
        assert_eq!(result.len(), 6);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_date_from_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let date_from = NaiveDate::from_ymd_opt(2024, 2, 1).unwrap();
        let params = OneoffTransactionQueryParams {
            date_from: Some(date_from),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should be on or after the date_from
        assert!(result.iter().all(|t| t.date >= date_from));
        assert_eq!(result.len(), 15);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_date_to_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let date_to = NaiveDate::from_ymd_opt(2024, 1, 31).unwrap();
        let params = OneoffTransactionQueryParams {
            date_to: Some(date_to),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should be on or before the date_to
        assert!(result.iter().all(|t| t.date <= date_to));
        assert_eq!(result.len(), 7);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_date_range_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let date_from = NaiveDate::from_ymd_opt(2024, 2, 1).unwrap();
        let date_to = NaiveDate::from_ymd_opt(2024, 2, 29).unwrap();
        let params = OneoffTransactionQueryParams {
            date_from: Some(date_from),
            date_to: Some(date_to),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should be within the date range
        assert!(
            result
                .iter()
                .all(|t| t.date >= date_from && t.date <= date_to)
        );
        assert_eq!(result.len(), 8);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_negative_date_range_no_results(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let date_from = NaiveDate::from_ymd_opt(2024, 4, 1).unwrap();
        let date_to = NaiveDate::from_ymd_opt(2024, 3, 31).unwrap();
        let params = OneoffTransactionQueryParams {
            date_from: Some(date_from),
            date_to: Some(date_to),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;
        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_amount_from_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let amount_from = Amount(100000); // 1000.00 in cents
        let params = OneoffTransactionQueryParams {
            amount_from: Some(amount_from),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should have amount >= amount_from
        assert!(result.iter().all(|t| t.amount >= *amount_from));
        assert_eq!(result.len(), 4);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_amount_to_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let amount_to = Amount(10000); // 100.00 in cents
        let params = OneoffTransactionQueryParams {
            amount_to: Some(amount_to),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should have amount <= amount_to
        assert!(result.iter().all(|t| t.amount <= *amount_to));
        assert_eq!(result.len(), 9);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_amount_range_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let amount_from = Amount(5000); // 50.00 in cents
        let amount_to = Amount(20000); // 200.00 in cents
        let params = OneoffTransactionQueryParams {
            amount_from: Some(amount_from),
            amount_to: Some(amount_to),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should be within the amount range
        assert!(
            result
                .iter()
                .all(|t| t.amount >= *amount_from && t.amount <= *amount_to)
        );
        assert_eq!(result.len(), 7);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_negative_amount_range_no_results(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let amount_from = Amount(10000); // 100.00 in cents
        let amount_to = Amount(5000); // 50.00 in cents
        let params = OneoffTransactionQueryParams {
            amount_from: Some(amount_from),
            amount_to: Some(amount_to),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;
        assert!(result.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_valid_category_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let category = get_category_by_name(&pool, user.id, "Groceries").await;
        let params = OneoffTransactionQueryParams {
            category_id: Some(UnvalidatedCategoryId::from(category.id)),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should belong to the specified category
        assert!(result.iter().all(|t| t.category_id == category.id));
        assert!(result.iter().all(|t| t.category == category.name));
        assert_eq!(result.len(), 3);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_invalid_category_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice

        OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams {
                category_id: Some(UnvalidatedCategoryId::from(999999)),
                ..Default::default()
            },
            Pagination::default(),
        )
        .await
        .expect_err("Oneoff transaction fetch with invalid category id didn't fail");

        OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams {
                category_id: Some(UnvalidatedCategoryId::from(14)),
                ..Default::default()
            },
            Pagination::default(),
        )
        .await
        .expect_err(
            "Oneoff transaction fetch with category id belonging to a different user didn't fail",
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_other_users_category_id(pool: PgPool) -> anyhow::Result<()> {
        let alice = get_user_by_id(&pool, 1).await;
        let bob_category = get_category_by_name(&pool, 2, "Food").await;

        let params = OneoffTransactionQueryParams {
            category_id: Some(UnvalidatedCategoryId::from(bob_category.id)),
            ..Default::default()
        };

        // Alice trying to filter by Bob's category should fail
        OneoffTransaction::fetch(&pool, &alice, params, Pagination::default())
            .await
            .expect_err(
                "Oneoff transaction fetch with category belonging to different user didn't fail",
            );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_valid_shop_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let shop = get_shop_by_name(&pool, user.id, "Whole Foods").await;
        let params = OneoffTransactionQueryParams {
            shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(shop.id))),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should belong to the specified shop
        assert!(result.iter().all(|t| t.shop_id == Some(shop.id)));
        assert!(result.iter().all(|t| t.shop == Some(shop.name.clone())));
        assert_eq!(result.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_shop_null(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice
        let params = OneoffTransactionQueryParams {
            shop_id: JsonField::Defined(None),
            ..Default::default()
        };

        let result = OneoffTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

        // All transactions should belong to the specified shop
        assert!(result.iter().all(|t| t.shop_id.is_none()));
        assert!(result.iter().all(|t| t.shop.is_none()));
        assert_eq!(result.len(), 2);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_invalid_shop_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice

        OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams {
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(999999))),
                ..Default::default()
            },
            Pagination::default(),
        )
        .await
        .expect_err("Oneoff transaction fetch with invalid shop id didn't fail");

        OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams {
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(16))),
                ..Default::default()
            },
            Pagination::default(),
        )
        .await
        .expect_err("Oneoff transaction fetch with invalid shop id didn't fail");

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_other_users_shop_id(pool: PgPool) -> anyhow::Result<()> {
        let alice = get_user_by_id(&pool, 1).await;
        let bob_shop = get_shop_by_name(&pool, 2, "Local Grocery").await;

        let params = OneoffTransactionQueryParams {
            shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(bob_shop.id))),
            ..Default::default()
        };

        // Alice trying to filter by Bob's shop should fail
        OneoffTransaction::fetch(&pool, &alice, params, Pagination::default())
            .await
            .expect_err(
                "Oneoff transaction fetch with shop belonging to different user didn't fail",
            );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_orer_by_time_asc(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Time).await?;
        assert!(
            result
                .windows(2)
                .all(|w| w[0].date < w[1].date || (w[0].date == w[1].date && w[0].id < w[1].id))
        );
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_orer_by_time_desc(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Time).await?;
        assert!(
            result
                .windows(2)
                .all(|w| w[0].date > w[1].date || (w[0].date == w[1].date && w[0].id > w[1].id))
        );
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_orer_by_amount_asc(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Amount).await?;
        assert!(result.windows(2).all(
            |w| w[0].amount < w[1].amount || (w[0].amount == w[1].amount && w[0].id < w[1].id)
        ));
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_orer_by_amount_desc(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Amount)
                .await?;
        assert!(result.windows(2).all(
            |w| w[0].amount > w[1].amount || (w[0].amount == w[1].amount && w[0].id > w[1].id)
        ));
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_orer_by_category_asc(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Category)
                .await?;
        assert!(result.windows(2).all(|w| w[0].category < w[1].category
            || (w[0].category == w[1].category && w[0].id < w[1].id)));
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_orer_by_category_desc(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Category)
                .await?;
        assert!(result.windows(2).all(|w| w[0].category > w[1].category
            || (w[0].category == w[1].category && w[0].id > w[1].id)));
        Ok(())
    }

    // TODO not working because Postgres uses collates for sorting, while Rust sorts by unicode codepoints
    // but the test should work(TM) if one ignores the rust behaviour
    #[sqlx::test(fixtures("base", "oneoff"))]
    #[ignore]
    fn test_fetch_orer_by_shop_asc_with_nulls_last(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Shop).await?;

        let mut trailing_nulls = 0;
        for element in result.iter().rev() {
            if element.shop.is_some() {
                break;
            }
            trailing_nulls += 1;
        }

        assert!(
            result[0..result.len() - trailing_nulls]
                .windows(2)
                .all(|w| w[0].shop < w[1].shop || (w[0].shop == w[1].shop && w[0].id < w[1].id))
        );
        Ok(())
    }

    // TODO not working because Postgres uses collates for sorting, while Rust sorts by unicode codepoints
    // but the test should work(TM) if one ignores the rust behaviour
    #[sqlx::test(fixtures("base", "oneoff"))]
    #[ignore]
    fn test_fetch_orer_by_shop_desc_with_nulls_first(pool: PgPool) -> anyhow::Result<()> {
        let result =
            fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Shop).await?;

        let mut leading_nulls = 0;
        for element in result.iter() {
            if element.shop.is_some() {
                break;
            }
            leading_nulls += 1;
        }

        assert!(
            result[leading_nulls..result.len()]
                .windows(2)
                .all(|w| w[0].shop > w[1].shop || (w[0].shop == w[1].shop && w[0].id > w[1].id))
        );
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_limit(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let result = OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams::default(),
            Pagination::new(Limit(5), Offset(0)),
        )
        .await?;

        assert_eq!(result.len(), 5);
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_with_offset_pagination(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Get first batch
        let pagination1 = Pagination::new(Limit(3), Offset(0));
        let result1 = OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams::default(),
            pagination1,
        )
        .await?;

        // Get second batch
        let pagination2 = Pagination::new(Limit(3), Offset(3));
        let result2 = OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams::default(),
            pagination2,
        )
        .await?;

        assert_eq!(result1.len(), 3);
        assert_eq!(result2.len(), 3);

        // Verify no overlap between batches
        let ids1: Vec<i32> = result1.iter().map(|t| t.id).collect();
        let ids2: Vec<i32> = result2.iter().map(|t| t.id).collect();
        for id1 in &ids1 {
            assert!(!ids2.contains(id1));
        }

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_offset_beyond_data(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Use a very large offset
        let pagination = Pagination::new(Limit(10), Offset(1000));
        let result = OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams::default(),
            pagination,
        )
        .await?;

        assert_eq!(result.len(), 0);
        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_fetch_limit_zero(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Use limit of 0
        let pagination = Pagination::new(Limit(0), Offset(0));
        let result = OneoffTransaction::fetch(
            &pool,
            &user,
            OneoffTransactionQueryParams::default(),
            pagination,
        )
        .await?;

        assert_eq!(result.len(), 0);
        Ok(())
    }

    // get_by_id tests
    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_get_by_id_basic(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Get the first transaction from fixtures: Weekly grocery shopping
        let result = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Failed to get transaction by id");

        assert_eq!(result.id, 1);
        assert_eq!(result.date, NaiveDate::from_ymd_opt(2024, 1, 15).unwrap());
        assert!(result.is_expense);
        assert_eq!(result.amount, 8542);
        assert_eq!(
            result.description,
            Some("Weekly grocery shopping".to_string())
        );
        assert_eq!(result.category_id, 1);
        assert_eq!(result.category, "Groceries"); // From fixtures
        assert_eq!(result.shop_id, Some(1));
        assert_eq!(result.shop, Some("Whole Foods".to_string())); // From fixtures
        assert_eq!(result.user_id, user.id);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_get_by_id_without_shop(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Get transaction with NULL shop_id: Weekend getaway hotel
        let result = OneoffTransaction::get_by_id(&pool, &user, 17)
            .await?
            .expect("Failed to get transaction by id");

        assert_eq!(result.id, 17);
        assert_eq!(result.date, NaiveDate::from_ymd_opt(2024, 3, 15).unwrap());
        assert!(result.is_expense);
        assert_eq!(result.amount, 67890);
        assert_eq!(
            result.description,
            Some("Weekend getaway hotel".to_string())
        );
        assert_eq!(result.category_id, 8);
        assert_eq!(result.shop_id, None);
        assert_eq!(result.shop, None); // This should be None due to LEFT JOIN
        assert_eq!(result.user_id, user.id);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_get_by_id_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user1 = get_user_by_id(&pool, 1).await;
        let user2 = get_user_by_id(&pool, 2).await;

        // Transaction ID 1 belongs to user 1, try to access it as user 2
        let result = OneoffTransaction::get_by_id(&pool, &user2, 1).await?;
        assert!(
            result.is_none(),
            "Should not be able to access another user's transaction"
        );

        // Verify that user 1 can still access their own transaction
        let result = OneoffTransaction::get_by_id(&pool, &user1, 1).await?;
        assert!(
            result.is_some(),
            "User 1 should be able to access their own transaction"
        );

        // Test accessing user 2's transaction as user 1
        let result = OneoffTransaction::get_by_id(&pool, &user1, 20).await?;
        assert!(
            result.is_none(),
            "User 1 should not be able to access user 2's transaction"
        );

        // Verify that user 2 can access their own transaction
        let result = OneoffTransaction::get_by_id(&pool, &user2, 20).await?;
        assert!(
            result.is_some(),
            "User 2 should be able to access their own transaction"
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_get_by_id_nonexistent_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Try to get a transaction with an ID that doesn't exist
        let result = OneoffTransaction::get_by_id(&pool, &user, 99999).await?;

        assert!(
            result.is_none(),
            "Should return None for nonexistent transaction ID"
        );

        Ok(())
    }

    // update tests
    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_nothing(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance =
            OneoffTransaction::update(&pool, &user, 1, OneoffTransactionUpdateParams::default())
                .await?
                .expect("Should return updated instance");

        // Note that updated_at shouldn't change either here
        assert_eq!(instance, updated_instance);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_date(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                date: Some(NaiveDate::from_ymd_opt(2030, 1, 1).unwrap()),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                date: NaiveDate::from_ymd_opt(2030, 1, 1).unwrap(),
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_is_expense(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                is_expense: Some(false),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                is_expense: false,
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_amount(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                amount: Some(Amount(10000)),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                amount: 10000,
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_description_some(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                description: JsonField::Defined(Some(Description("new description".to_string()))),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                description: Some("new description".to_string()),
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_description_none(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                description: JsonField::Defined(None),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                description: None,
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_valid_category_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                category_id: Some(UnvalidatedCategoryId::from(4)),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                category_id: 4,
                category: "Entertainment".to_string(),
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_invalid_category_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                category_id: Some(UnvalidatedCategoryId::from(999999)),
                ..Default::default()
            },
        )
        .await
        .expect_err("Shouldn't update with invalid category id");

        OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                category_id: Some(UnvalidatedCategoryId::from(14)),
                ..Default::default()
            },
        )
        .await
        .expect_err("Shouldn't update with category id belonging to a different user");

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_valid_shop_id_some(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(4))),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                shop_id: Some(4),
                shop: Some("Starbucks".to_string()),
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_valid_shop_id_none(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let instance = OneoffTransaction::get_by_id(&pool, &user, 1)
            .await?
            .expect("Should find instance created by fixtures");

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                shop_id: JsonField::Defined(None),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            OneoffTransaction {
                shop_id: None,
                shop: None,
                updated_at: updated_instance.updated_at,
                ..instance
            },
            updated_instance
        );
        assert_eq!(
            OneoffTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should fetch updated transaction"),
            updated_instance
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_invalid_shop_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(999999))),
                ..Default::default()
            },
        )
        .await
        .expect_err("Shouldn't update with invalid shop id");

        OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(16))),
                ..Default::default()
            },
        )
        .await
        .expect_err("Shouldn't update with shop id belonging to a different user");

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_multiple_fields(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                date: Some(NaiveDate::from_ymd_opt(2030, 1, 1).unwrap()),
                is_expense: Some(false),
                amount: Some(Amount(10000)),
                description: JsonField::Defined(None),
                category_id: Some(UnvalidatedCategoryId::from(4)),
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(4))),
            },
        )
        .await?
        .expect("Should return updated instance");

        assert_eq!(
            instance,
            OneoffTransaction {
                date: NaiveDate::from_ymd_opt(2030, 1, 1).unwrap(),
                user_id: 1,
                is_expense: false,
                amount: 10000,
                description: None,
                category_id: 4,
                category: "Entertainment".to_string(),
                shop_id: Some(4),
                shop: Some("Starbucks".to_string()),
                ..instance
            }
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_updated_at_timestamp(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let updated_at_before = sqlx::query_scalar!(
            "SELECT updated_at FROM oneoff_transactions WHERE user_id = $1 AND id = $2",
            user.id,
            1
        )
        .fetch_one(&pool)
        .await?;

        // Wait a bit then update
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let updated_instance = OneoffTransaction::update(
            &pool,
            &user,
            1,
            OneoffTransactionUpdateParams {
                amount: Some(Amount(10000)),
                ..Default::default()
            },
        )
        .await?
        .expect("Should return updated instance");

        assert!(updated_at_before < updated_instance.updated_at);

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_other_users_transaction(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let user_2_transaction = sqlx::query!(
            "SELECT id, description, updated_at FROM oneoff_transactions WHERE user_id = $1",
            2
        )
        .fetch_one(&pool)
        .await?;

        assert!(
            OneoffTransaction::update(
                &pool,
                &user,
                user_2_transaction.id,
                OneoffTransactionUpdateParams {
                    description: JsonField::Defined(Some(Description(
                        "updated description".to_string()
                    ))),
                    ..Default::default()
                },
            )
            .await?
            .is_none(),
            "Shouldn't change transaction belonging to different user"
        );

        // Check transaction hasn't been modified
        let transaction_after_update = sqlx::query!(
            "SELECT id, description, updated_at FROM oneoff_transactions WHERE id = $1",
            user_2_transaction.id
        )
        .fetch_one(&pool)
        .await?;

        assert_eq!(
            transaction_after_update.description,
            user_2_transaction.description
        );
        assert_eq!(
            transaction_after_update.updated_at,
            user_2_transaction.updated_at
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_update_nonexistent_transaction(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        assert!(
            OneoffTransaction::update(
                &pool,
                &user,
                999999,
                OneoffTransactionUpdateParams {
                    description: JsonField::Defined(Some(Description(
                        "updated description".to_string()
                    ))),
                    ..Default::default()
                },
            )
            .await?
            .is_none(),
            "Should fail to update non-existent transaction"
        );

        // Check no transaction with this id exists
        assert_eq!(
            sqlx::query_scalar!("SELECT COUNT(*) FROM oneoff_transactions WHERE id = 999999")
                .fetch_one(&pool)
                .await?,
            Some(0)
        );

        Ok(())
    }

    // remove tests
    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_remove_basic(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Delete the transaction (Weekly grocery shopping)
        let rows_affected = OneoffTransaction::remove(&pool, &user, 1).await?;
        assert_eq!(rows_affected, 1, "Should affect exactly 1 row");

        // Verify the transaction no longer exists
        let direct_query = sqlx::query!("SELECT id FROM oneoff_transactions WHERE id = $1", 1)
            .fetch_optional(&pool)
            .await?;
        assert!(
            direct_query.is_none(),
            "Transaction should not exist in database after deletion"
        );

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_remove_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user2 = get_user_by_id(&pool, 2).await;

        // Try to delete user 1's transaction as user 2 (should not work)
        let rows_affected = OneoffTransaction::remove(&pool, &user2, 1).await?;
        assert_eq!(
            rows_affected, 0,
            "Should not affect any rows when trying to delete another user's transaction"
        );

        // Verify user 1's transaction still exists
        sqlx::query!("SELECT id FROM oneoff_transactions WHERE id = $1", 1)
            .fetch_optional(&pool)
            .await?
            .expect("User 1's transaction should still exist after rejected remove attempt");

        Ok(())
    }

    #[sqlx::test(fixtures("base", "oneoff"))]
    fn test_remove_nonexistent_id(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Try to delete a transaction with an ID that doesn't exist
        let rows_affected = OneoffTransaction::remove(&pool, &user, 99999).await?;
        assert_eq!(
            rows_affected, 0,
            "Should not affect any rows for nonexistent transaction ID"
        );

        Ok(())
    }
}
