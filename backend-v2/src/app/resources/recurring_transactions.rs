use axum::http::StatusCode;
use chrono::{DateTime, Datelike, NaiveDate, Utc};
use garde::Validate;
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder, prelude::FromRow};

use crate::{
    app::{
        api::json_field::JsonField,
        resources::{
            Resource,
            recurring_transactions::{
                recurrence::{Recurrence, RecurrenceFrequency},
                year_month::YearMonth,
            },
        },
        transactions::{
            Amount, Description, OrderKey, Ordering, UnvalidatedCategoryId, UnvalidatedShopId,
        },
    },
    errors::ServerError,
};

mod recurrence;
mod year_month;

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurringTransaction {
    id: i32,
    recurrence: Recurrence,
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

impl TryFrom<RawRecurringTransaction> for RecurringTransaction {
    type Error = garde::Report;

    fn try_from(value: RawRecurringTransaction) -> Result<Self, garde::Report> {
        let recurrence = match value.frequency {
            RecurrenceFrequency::Monthly => Recurrence::Monthly {
                month_from: YearMonth::new(
                    value.interval_from.year(),
                    value.interval_from.month0() + 1,
                )?,
                month_to: match value.interval_to {
                    Some(val) => Some(YearMonth::new(val.year(), val.month0() + 1)?),
                    None => None,
                },
            },
            RecurrenceFrequency::Yearly => Recurrence::Yearly {
                year_from: value.interval_from.year(),
                year_to: value.interval_to.map(|val| val.year()),
            },
        };

        let RawRecurringTransaction {
            id,
            user_id,
            created_at,
            updated_at,
            is_expense,
            amount,
            description,
            category_id,
            category,
            shop_id,
            shop,
            ..
        } = value;

        Ok(Self {
            id,
            recurrence,
            user_id,
            created_at,
            updated_at,
            is_expense,
            amount,
            description,
            category_id,
            category,
            shop_id,
            shop,
        })
    }
}

#[derive(FromRow)]
struct RawRecurringTransaction {
    id: i32,
    frequency: RecurrenceFrequency,
    interval_from: NaiveDate,
    interval_to: Option<NaiveDate>,
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
pub struct RecurringTransactionCreateParams {
    #[garde(dive)]
    recurrence: Recurrence,
    #[garde(skip)]
    is_expense: bool,
    #[garde(dive)]
    amount: Amount,
    #[garde(length(graphemes, min = 1))]
    description: Option<String>,
    #[garde(dive)]
    category_id: UnvalidatedCategoryId,
    #[garde(dive)]
    shop_id: Option<UnvalidatedShopId>,
}

#[derive(Debug, Clone, Default, Deserialize, Validate)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RecurringTransactionFetchParams {
    #[garde(skip)]
    frequency: Option<RecurrenceFrequency>,
    #[garde(dive)]
    interval_ends_ge: Option<YearMonth>,
    #[garde(dive)]
    interval_starts_le: Option<YearMonth>,
    #[garde(skip)]
    is_terminating: Option<bool>,
    #[garde(skip)]
    is_expense: Option<bool>,
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
pub struct RecurringTransactionUpdateParams {
    #[garde(dive)]
    recurrence: Option<Recurrence>,
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

impl Resource for RecurringTransaction {
    type CreateParams = RecurringTransactionCreateParams;
    type FetchParams = RecurringTransactionFetchParams;
    type UpdateParams = RecurringTransactionUpdateParams;
    type ReturnType = RecurringTransaction;
    type VecReturnType = Vec<RecurringTransaction>;
    type Error = ServerError;

    async fn create(
        database: &sqlx::PgPool,
        user: &crate::users::User,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        let recurrence_frequency;
        let interval_from;
        let interval_to;
        match params.recurrence {
            Recurrence::Yearly { year_from, year_to } => {
                recurrence_frequency = RecurrenceFrequency::Yearly;
                interval_from = NaiveDate::from_ymd_opt(year_from, 1, 1)
                    .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
                interval_to = year_to
                    .map(|value| {
                        NaiveDate::from_ymd_opt(value, 1, 1)
                            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)
                    })
                    .transpose()?;
            }
            Recurrence::Monthly {
                month_from,
                month_to,
            } => {
                recurrence_frequency = RecurrenceFrequency::Monthly;
                interval_from = NaiveDate::from_ymd_opt(month_from.year, month_from.month, 1)
                    .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
                interval_to = month_to
                    .map(|value| {
                        NaiveDate::from_ymd_opt(value.year, value.month, 1)
                            .ok_or(StatusCode::INTERNAL_SERVER_ERROR)
                    })
                    .transpose()?;
            }
        }
        let result = sqlx::query_as!(
            RawRecurringTransaction,
            r#"
            WITH insert AS (
                INSERT INTO recurring_transactions
                (user_id, frequency, interval_from, interval_to, is_expense, amount, description, category_id, shop_id)
                VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            )
            SELECT rt.id, rt.interval_from, rt.interval_to, rt.created_at, rt.updated_at, rt.user_id, rt.is_expense, rt.amount, rt.description, rt.category_id, rt.shop_id, rt.frequency as "frequency: RecurrenceFrequency", c.name as category, s.name as "shop?"
            FROM insert rt
            INNER JOIN categories c on rt.category_id = c.id
            LEFT JOIN shops s on rt.shop_id = s.id
            "#,
            user.id,
            recurrence_frequency as _,
            interval_from,
            interval_to,
            params.is_expense,
            *params.amount,
            params.description,
            params.category_id.validate(user, database).await?,
            match params.shop_id {
                Some(value) => Some(value.validate(user, database).await?),
                None => None
            }
        ).fetch_optional(database).await?;

        Ok(match result {
            Some(val) => Some(val.try_into()?),
            None => None,
        })
    }

    async fn fetch(
        database: &sqlx::PgPool,
        user: &crate::users::User,
        params: Self::FetchParams,
        pagination: crate::app::api::pagination::Pagination,
    ) -> Result<Self::VecReturnType, Self::Error> {
        let mut query_builder: QueryBuilder<Postgres> = QueryBuilder::new(
            r#"
                SELECT
                    rt.*,
                    c.name as category,
                    s.name as shop
                FROM recurring_transactions rt
                INNER JOIN categories c ON rt.category_id = c.id
                LEFT JOIN shops s ON rt.shop_id = s.id
                WHERE rt.user_id =
        "#,
        );
        query_builder.push_bind(user.id);

        if let Some(is_expense) = params.is_expense {
            query_builder
                .push(" AND rt.is_expense = ")
                .push_bind(is_expense);
        }

        if let Some(frequency) = params.frequency {
            query_builder
                .push(" AND rt.frequency = ")
                .push_bind(frequency);
        }

        if let Some(ends_after) = params.interval_ends_ge {
            // If some, all transaction intervals must end after the given value. This includes the case interval_to = NULL
            query_builder
                .push(" AND (rt.interval_to >= ")
                .push_bind(ends_after.to_naive_date())
                .push(" OR rt.interval_to IS NULL)");
        }

        if let Some(starts_before) = params.interval_starts_le {
            // If some, all instances must start before the given value.
            query_builder
                .push(" AND rt.interval_from <= ")
                .push_bind(starts_before.to_naive_date());
        }

        if let Some(false) = params.is_terminating {
            // If some, all instances must start before the given value.
            query_builder.push(" AND rt.interval_to IS NULL");
        }

        if let Some(true) = params.is_terminating {
            // If some, all instances must start before the given value.
            query_builder.push(" AND rt.interval_to IS NOT NULL");
        }

        if let Some(amount_from) = params.amount_from {
            query_builder
                .push(" AND rt.amount >= ")
                .push_bind(*amount_from);
        }

        if let Some(amount_to) = params.amount_to {
            query_builder
                .push(" AND rt.amount <= ")
                .push_bind(*amount_to);
        }

        if let Some(category_id) = params.category_id {
            query_builder
                .push(" AND rt.category_id = ")
                .push_bind(category_id.validate(user, database).await?);
        }

        if let JsonField::Defined(Some(shop_id)) = params.shop_id {
            query_builder
                .push(" AND rt.shop_id = ")
                .push_bind(shop_id.validate(user, database).await?);
        } else if let JsonField::Defined(None) = params.shop_id {
            query_builder.push(" AND rt.shop_id IS NULL");
        }

        // Handle ordering
        query_builder.push(" ORDER BY");

        match params.order_key {
            OrderKey::Time => query_builder.push(format!(
                " rt.interval_from {}, rt.interval_to {}",
                params.ordering, params.ordering
            )),
            OrderKey::Amount => query_builder.push(format!(" rt.amount {}", params.ordering)),
            OrderKey::Category => query_builder.push(format!(" c.name {}", params.ordering)),
            OrderKey::Shop => query_builder.push(format!(" s.name {}", params.ordering)),
        };
        query_builder.push(format!(", rt.id {}", params.ordering));

        query_builder.push(" LIMIT ").push_bind(pagination.limit.0);
        query_builder
            .push(" OFFSET ")
            .push_bind(pagination.offset.0);

        let result: Result<Vec<RecurringTransaction>, _> = query_builder
            .build_query_as::<RawRecurringTransaction>()
            .fetch_all(database)
            .await?
            .into_iter()
            .map(|rt| rt.try_into())
            .collect();

        Ok(result?)
    }

    async fn get_by_id(
        database: &sqlx::PgPool,
        user: &crate::users::User,
        id: i32,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        let result = sqlx::query_as!(
            RawRecurringTransaction,
            r#"
            SELECT rt.id, rt.interval_from, rt.interval_to, rt.created_at, rt.updated_at, rt.user_id, rt.is_expense, rt.amount, rt.description, rt.category_id, rt.shop_id, rt.frequency as "frequency: RecurrenceFrequency", c.name as category, s.name as "shop?"
            FROM recurring_transactions rt
            INNER JOIN categories c on rt.category_id = c.id
            LEFT JOIN shops s on rt.shop_id = s.id
            WHERE rt.user_id = $1 AND rt.id = $2
            "#,
            user.id,
            id
        )
        .fetch_optional(database)
        .await?;

        Ok(match result {
            Some(val) => Some(val.try_into()?),
            None => None,
        })
    }

    async fn update(
        database: &sqlx::PgPool,
        user: &crate::users::User,
        id: i32,
        params: Self::UpdateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        // Start building the dynamic query
        let mut query_parts = Vec::new();
        let mut bind_count = 1;

        // Build SET clause dynamically based on provided parameters
        // Note that no actual values are inserted at this point
        if params.recurrence.is_some() {
            // Always write all recurrence data for simplicity
            query_parts.push(format!("frequency = ${bind_count}"));
            bind_count += 1;
            query_parts.push(format!("interval_from = ${bind_count}"));
            bind_count += 1;
            query_parts.push(format!("interval_to = ${bind_count}"));
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
            "UPDATE recurring_transactions SET {} WHERE user_id = ${} AND id = ${}",
            query_parts.join(", "),
            bind_count,
            bind_count + 1
        );

        // Start building the query with sqlx
        let mut query = sqlx::query(&sql);

        // Bind parameters in the same order as they were added to query_parts
        if let Some(recurrence) = params.recurrence {
            match recurrence {
                Recurrence::Monthly {
                    month_from,
                    month_to,
                } => {
                    query = query.bind(RecurrenceFrequency::Monthly);
                    query = query.bind(month_from.to_naive_date());
                    query = query.bind(month_to.map(|val| val.to_naive_date()));
                }
                Recurrence::Yearly { year_from, year_to } => {
                    query = query.bind(RecurrenceFrequency::Yearly);
                    query = query.bind(
                        NaiveDate::from_ymd_opt(year_from, 1, 1)
                            .expect("Couldn't create NaiveDate year"),
                    );
                    query = query.bind(year_to.map(|val| {
                        NaiveDate::from_ymd_opt(val, 1, 1).expect("Couldn't create NaiveDate year")
                    }));
                }
            };
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

    async fn remove(
        database: &sqlx::PgPool,
        user: &crate::users::User,
        id: i32,
    ) -> Result<u64, Self::Error> {
        let result = sqlx::query!(
            "DELETE FROM recurring_transactions WHERE user_id = $1 AND id = $2",
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
    use std::cmp;

    use super::*;

    use sqlx::PgPool;

    use crate::{
        app::{
            api::pagination::{Limit, Offset, Pagination},
            resources::categories_shops::{Category, Shop},
            transactions::Ordering,
        },
        users::User,
    };

    fn compare_recurrence(lhs: &Recurrence, rhs: &Recurrence) -> cmp::Ordering {
        fn to_interval(recurrence: &Recurrence) -> (NaiveDate, Option<NaiveDate>) {
            match recurrence {
                Recurrence::Yearly { year_from, year_to } => (
                    NaiveDate::from_ymd_opt(*year_from, 1, 1).unwrap(),
                    year_to.map(|value| NaiveDate::from_ymd_opt(value, 1, 1).unwrap()),
                ),
                Recurrence::Monthly {
                    month_from,
                    month_to,
                } => (
                    month_from.to_naive_date(),
                    month_to.as_ref().map(|value| value.to_naive_date()),
                ),
            }
        }

        let interval_lhs = to_interval(lhs);
        let interval_rhs = to_interval(rhs);

        interval_lhs
            .0
            .cmp(&interval_rhs.0)
            .then(match (interval_lhs.1, interval_rhs.1) {
                (None, None) => cmp::Ordering::Equal,
                (None, Some(_)) => cmp::Ordering::Greater,
                (Some(_), None) => cmp::Ordering::Less,
                (Some(lhs), Some(rhs)) => lhs.cmp(&rhs),
            })
    }

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
    ) -> anyhow::Result<Vec<RecurringTransaction>> {
        let result = RecurringTransaction::fetch(
            pool,
            &sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", user_id)
                .fetch_one(pool)
                .await?,
            RecurringTransactionFetchParams {
                ordering,
                order_key,
                ..Default::default()
            },
            Pagination::default(),
        )
        .await?;

        Ok(result)
    }

    mod tests_create {
        use super::*;

        #[sqlx::test(fixtures("base"))]
        fn test_create_instance_yearly(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let category = get_category_by_name(&pool, user.id, "Groceries").await;

            let result = RecurringTransaction::create(
                &pool,
                &user,
                RecurringTransactionCreateParams {
                    recurrence: Recurrence::Yearly {
                        year_from: 2024,
                        year_to: Some(2025),
                    },
                    is_expense: true,
                    amount: Amount(1),
                    description: None,
                    category_id: UnvalidatedCategoryId::from(category.id),
                    shop_id: None,
                },
            )
            .await?
            .expect("Failed to create recurring transaction");

            assert_eq!(
                result.recurrence,
                Recurrence::Yearly {
                    year_from: 2024,
                    year_to: Some(2025),
                }
            );
            assert!(result.is_expense);
            assert_eq!(result.amount, 1);
            assert_eq!(result.description, None);
            assert_eq!(result.category_id, category.id);
            assert_eq!(result.category, category.name);
            assert_eq!(result.shop_id, None);
            assert_eq!(result.shop, None);

            // Test that the instruction was created
            sqlx::query_scalar!(
                "SELECT id FROM recurring_transactions WHERE id = $1",
                result.id
            )
            .fetch_one(&pool)
            .await?;

            Ok(())
        }

        #[sqlx::test(fixtures("base"))]
        fn test_create_instance_monthly(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let category = get_category_by_name(&pool, user.id, "Groceries").await;

            let result = RecurringTransaction::create(
                &pool,
                &user,
                RecurringTransactionCreateParams {
                    recurrence: Recurrence::Monthly {
                        month_from: YearMonth::new(2024, 12)?,
                        month_to: Some(YearMonth::new(2025, 12)?),
                    },
                    is_expense: true,
                    amount: Amount(1),
                    description: None,
                    category_id: UnvalidatedCategoryId::from(category.id),
                    shop_id: None,
                },
            )
            .await?
            .expect("Failed to create recurring transaction");

            assert_eq!(
                result.recurrence,
                Recurrence::Monthly {
                    month_from: YearMonth::new(2024, 12)?,
                    month_to: Some(YearMonth::new(2025, 12)?),
                },
            );
            assert!(result.is_expense);
            assert_eq!(result.amount, 1);
            assert_eq!(result.description, None);
            assert_eq!(result.category_id, category.id);
            assert_eq!(result.category, category.name);
            assert_eq!(result.shop_id, None);
            assert_eq!(result.shop, None);

            // Test that the instruction was created
            sqlx::query_scalar!(
                "SELECT id FROM recurring_transactions WHERE id = $1",
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

            let result = RecurringTransaction::create(
                &pool,
                &user,
                RecurringTransactionCreateParams {
                    recurrence: Recurrence::Yearly {
                        year_from: 2024,
                        year_to: Some(2025),
                    },
                    is_expense: true,
                    amount: Amount(1),
                    description: None,
                    category_id: UnvalidatedCategoryId::from(category.id),
                    shop_id: Some(UnvalidatedShopId::from(shop.id)),
                },
            )
            .await?
            .expect("Failed to create recurring transaction");

            assert_eq!(
                result.recurrence,
                Recurrence::Yearly {
                    year_from: 2024,
                    year_to: Some(2025),
                }
            );
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

            let instructions_before =
                sqlx::query_scalar!("SELECT COUNT(*) FROM recurring_transactions")
                    .fetch_one(&pool)
                    .await?
                    .expect("No count returned");

            RecurringTransaction::create(
                &pool,
                &user,
                RecurringTransactionCreateParams {
                    recurrence: Recurrence::Yearly {
                        year_from: 2024,
                        year_to: Some(0),
                    },
                    is_expense: true,
                    amount: Amount(1),
                    description: None,
                    category_id: UnvalidatedCategoryId::from(999999),
                    shop_id: None,
                },
            )
            .await
            .expect_err("Shouldn't create with invalid category id");

            RecurringTransaction::create(
                &pool,
                &user,
                RecurringTransactionCreateParams {
                    recurrence: Recurrence::Yearly {
                        year_from: 2024,
                        year_to: Some(0),
                    },
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
                sqlx::query_scalar!("SELECT COUNT(*) FROM recurring_transactions")
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

            let transactions_before =
                sqlx::query_scalar!("SELECT COUNT(*) FROM recurring_transactions")
                    .fetch_one(&pool)
                    .await?
                    .expect("No count returned");

            RecurringTransaction::create(
                &pool,
                &user,
                RecurringTransactionCreateParams {
                    recurrence: Recurrence::Yearly {
                        year_from: 2024,
                        year_to: Some(0),
                    },
                    is_expense: true,
                    amount: Amount(1),
                    description: None,
                    category_id: UnvalidatedCategoryId::from(category.id),
                    shop_id: Some(UnvalidatedShopId::from(999999)),
                },
            )
            .await
            .expect_err("Shouldn't create with invalid shop id");

            RecurringTransaction::create(
                &pool,
                &user,
                RecurringTransactionCreateParams {
                    recurrence: Recurrence::Yearly {
                        year_from: 2024,
                        year_to: Some(0),
                    },
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
                sqlx::query_scalar!("SELECT COUNT(*) FROM recurring_transactions")
                    .fetch_one(&pool)
                    .await?
                    .expect("No count returned"),
                transactions_before
            );

            Ok(())
        }
    }

    mod tests_fetch {
        use super::*;

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_all(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            let result = RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams::default(),
                Pagination::default(),
            )
            .await?;

            assert_eq!(result.len(), 11);
            assert!(result.iter().all(|t| t.user_id == user.id));

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_default_ordering(pool: PgPool) -> anyhow::Result<()> {
            let user: User = get_user_by_id(&pool, 1).await;
            let result = RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams::default(),
                Pagination::default(),
            )
            .await?;

            // Default ordering is based on recurrence ASC, id ASC
            assert!(
                result
                    .windows(2)
                    .all(|w| compare_recurrence(&w[0].recurrence, &w[1].recurrence).is_le())
            );
            assert!(result.iter().all(|t| t.user_id == user.id));

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_only_incomes(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let params = RecurringTransactionFetchParams {
                is_expense: Some(false),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All should be incomes
            assert!(result.iter().all(|t| !t.is_expense));
            assert_eq!(result.len(), 3);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_only_yearly(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let params = RecurringTransactionFetchParams {
                frequency: Some(RecurrenceFrequency::Yearly),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All should be yearly
            assert!(
                result
                    .iter()
                    .all(|t| matches!(t.recurrence, Recurrence::Yearly { .. }))
            );
            assert_eq!(result.len(), 2);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_only_monthly(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let params = RecurringTransactionFetchParams {
                frequency: Some(RecurrenceFrequency::Monthly),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All should be yearly
            assert!(
                result
                    .iter()
                    .all(|t| matches!(t.recurrence, Recurrence::Monthly { .. }))
            );
            assert_eq!(result.len(), 9);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_starts_le(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let params = RecurringTransactionFetchParams {
                interval_starts_le: Some(YearMonth::new(2024, 1)?),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All should start in (january) 2024 or in an earlier year
            assert!(result.iter().all(|t| match &t.recurrence {
                Recurrence::Yearly { year_from, .. } => *year_from <= 2024,
                Recurrence::Monthly { month_from, .. } =>
                    (month_from.year == 2024 && month_from.month == 1) || month_from.year < 2024,
            }));
            assert_eq!(result.len(), 7);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_ends_ge(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let params = RecurringTransactionFetchParams {
                interval_ends_ge: Some(YearMonth::new(2025, 1)?),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All should end in 2025 or later
            assert!(result.iter().all(|t| match &t.recurrence {
                Recurrence::Yearly { year_to, .. } => year_to.is_none_or(|year| year >= 2025),
                Recurrence::Monthly { month_to, .. } =>
                    month_to.as_ref().is_none_or(|month| month.year >= 2025),
            }));
            assert_eq!(result.len(), 5);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_interval_range(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let interval_starts_le = Some(YearMonth::new(2024, 1)?);
            let interval_ends_ge = Some(YearMonth::new(2024, 12)?);
            let params = RecurringTransactionFetchParams {
                interval_starts_le,
                interval_ends_ge,
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;
            assert_eq!(result.len(), 4);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_is_not_terminating(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let params = RecurringTransactionFetchParams {
                is_terminating: Some(false),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should have amount >= amount_from
            assert!(result.iter().all(|t| match &t.recurrence {
                Recurrence::Yearly { year_to, .. } => year_to.is_none(),
                Recurrence::Monthly { month_to, .. } => month_to.is_none(),
            }));
            assert_eq!(result.len(), 4);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_is_terminating(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let params = RecurringTransactionFetchParams {
                is_terminating: Some(true),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should have amount >= amount_from
            assert!(result.iter().all(|t| match &t.recurrence {
                Recurrence::Yearly { year_to, .. } => year_to.is_some(),
                Recurrence::Monthly { month_to, .. } => month_to.is_some(),
            }));
            assert_eq!(result.len(), 7);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_amount_from_filter(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let amount_from = Amount(100000); // 1000.00 in cents
            let params = RecurringTransactionFetchParams {
                amount_from: Some(amount_from),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should have amount >= amount_from
            assert!(result.iter().all(|t| t.amount >= *amount_from));
            assert_eq!(result.len(), 2);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_amount_to_filter(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let amount_to = Amount(10000); // 100.00 in cents
            let params = RecurringTransactionFetchParams {
                amount_to: Some(amount_to),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should have amount <= amount_to
            assert!(result.iter().all(|t| t.amount <= *amount_to));
            assert_eq!(result.len(), 4);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_amount_range_filter(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let amount_from = Amount(5000); // 50.00 in cents
            let amount_to = Amount(20000); // 200.00 in cents
            let params = RecurringTransactionFetchParams {
                amount_from: Some(amount_from),
                amount_to: Some(amount_to),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should be within the amount range
            assert!(
                result
                    .iter()
                    .all(|t| t.amount >= *amount_from && t.amount <= *amount_to)
            );
            assert_eq!(result.len(), 4);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_negative_amount_range_no_results(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let amount_from = Amount(10000); // 100.00 in cents
            let amount_to = Amount(5000); // 50.00 in cents
            let params = RecurringTransactionFetchParams {
                amount_from: Some(amount_from),
                amount_to: Some(amount_to),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;
            assert!(result.is_empty());

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_valid_category_filter(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let category = get_category_by_name(&pool, user.id, "Entertainment").await;
            let params = RecurringTransactionFetchParams {
                category_id: Some(UnvalidatedCategoryId::from(category.id)),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should belong to the specified category
            assert!(result.iter().all(|t| t.category_id == category.id));
            assert!(result.iter().all(|t| t.category == category.name));
            assert_eq!(result.len(), 5);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_invalid_category_id(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice

            RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams {
                    category_id: Some(UnvalidatedCategoryId::from(999999)),
                    ..Default::default()
                },
                Pagination::default(),
            )
            .await
            .expect_err("recurring transaction fetch with invalid category id didn't fail");

            RecurringTransaction::fetch(
            &pool,
            &user,
            RecurringTransactionFetchParams {
                category_id: Some(UnvalidatedCategoryId::from(14)),
                ..Default::default()
            },
            Pagination::default(),
        )
        .await
        .expect_err(
            "recurring transaction fetch with category id belonging to a different user didn't fail",
        );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_other_users_category_id(pool: PgPool) -> anyhow::Result<()> {
            let alice = get_user_by_id(&pool, 1).await;
            let bob_category = get_category_by_name(&pool, 2, "Food").await;

            let params = RecurringTransactionFetchParams {
                category_id: Some(UnvalidatedCategoryId::from(bob_category.id)),
                ..Default::default()
            };

            // Alice trying to filter by Bob's category should fail
            RecurringTransaction::fetch(&pool, &alice, params, Pagination::default())
            .await
            .expect_err(
                "recurring transaction fetch with category belonging to different user didn't fail",
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_valid_shop_filter(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let shop = get_shop_by_name(&pool, user.id, "Netflix").await;
            let params = RecurringTransactionFetchParams {
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(shop.id))),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should belong to the specified shop
            assert!(result.iter().all(|t| t.shop_id == Some(shop.id)));
            assert!(result.iter().all(|t| t.shop == Some(shop.name.clone())));
            assert_eq!(result.len(), 3);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_shop_null(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice
            let params = RecurringTransactionFetchParams {
                shop_id: JsonField::Defined(None),
                ..Default::default()
            };

            let result =
                RecurringTransaction::fetch(&pool, &user, params, Pagination::default()).await?;

            // All transactions should belong to the specified shop
            assert!(result.iter().all(|t| t.shop_id.is_none()));
            assert!(result.iter().all(|t| t.shop.is_none()));
            assert_eq!(result.len(), 5);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_invalid_shop_id(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await; // Alice

            RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams {
                    shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(999999))),
                    ..Default::default()
                },
                Pagination::default(),
            )
            .await
            .expect_err("recurring transaction fetch with invalid shop id didn't fail");

            RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams {
                    shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(16))),
                    ..Default::default()
                },
                Pagination::default(),
            )
            .await
            .expect_err("recurring transaction fetch with invalid shop id didn't fail");

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_other_users_shop_id(pool: PgPool) -> anyhow::Result<()> {
            let alice = get_user_by_id(&pool, 1).await;
            let bob_shop = get_shop_by_name(&pool, 2, "Local Grocery").await;

            let params = RecurringTransactionFetchParams {
                shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(bob_shop.id))),
                ..Default::default()
            };

            // Alice trying to filter by Bob's shop should fail
            RecurringTransaction::fetch(&pool, &alice, params, Pagination::default())
                .await
                .expect_err(
                    "recurring transaction fetch with shop belonging to different user didn't fail",
                );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_by_time_asc(pool: PgPool) -> anyhow::Result<()> {
            let result =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Time)
                    .await?;

            assert!(
                result
                    .windows(2)
                    .all(|w| compare_recurrence(&w[0].recurrence, &w[1].recurrence).is_le())
            );
            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_by_time_desc(pool: PgPool) -> anyhow::Result<()> {
            let result =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Time)
                    .await?;
            assert!(
                result
                    .windows(2)
                    .all(|w| compare_recurrence(&w[0].recurrence, &w[1].recurrence).is_ge())
            );
            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_by_amount_asc(pool: PgPool) -> anyhow::Result<()> {
            let result =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Amount)
                    .await?;
            assert!(
                result.windows(2).all(|w| w[0].amount < w[1].amount
                    || (w[0].amount == w[1].amount && w[0].id < w[1].id))
            );
            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_by_amount_desc(pool: PgPool) -> anyhow::Result<()> {
            let result =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Amount)
                    .await?;
            assert!(
                result.windows(2).all(|w| w[0].amount > w[1].amount
                    || (w[0].amount == w[1].amount && w[0].id > w[1].id))
            );
            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_by_category_asc(pool: PgPool) -> anyhow::Result<()> {
            let result: Vec<RecurringTransaction> =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Category)
                    .await?;
            assert!(result.windows(2).all(|w| w[0].category < w[1].category
                || (w[0].category == w[1].category && w[0].id < w[1].id)));
            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_by_category_desc(pool: PgPool) -> anyhow::Result<()> {
            let result =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Category)
                    .await?;
            assert!(result.windows(2).all(|w| w[0].category > w[1].category
                || (w[0].category == w[1].category && w[0].id > w[1].id)));
            Ok(())
        }

        // TODO not working because Postgres uses collates for sorting, while Rust sorts by unicode codepoints
        // but the test should work(TM) if one ignores the rust behaviour
        #[sqlx::test(fixtures("base", "recurring"))]
        #[ignore]
        fn test_fetch_by_shop_asc_with_nulls_last(pool: PgPool) -> anyhow::Result<()> {
            let result =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Asc, OrderKey::Shop)
                    .await?;

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
        #[sqlx::test(fixtures("base", "recurring"))]
        #[ignore]
        fn test_fetch_by_shop_desc_with_nulls_first(pool: PgPool) -> anyhow::Result<()> {
            let result =
                fetch_all_transactions_with_ordering(&pool, 1, Ordering::Desc, OrderKey::Shop)
                    .await?;

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

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_limit(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            let result = RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams::default(),
                Pagination::new(Limit(5), Offset(0)),
            )
            .await?;

            assert_eq!(result.len(), 5);
            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_with_offset_pagination(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            // Get first batch
            let pagination1 = Pagination::new(Limit(3), Offset(0));
            let result1 = RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams::default(),
                pagination1,
            )
            .await?;

            // Get second batch
            let pagination2 = Pagination::new(Limit(3), Offset(3));
            let result2 = RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams::default(),
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

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_offset_beyond_data(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            // Use a very large offset
            let pagination = Pagination::new(Limit(10), Offset(1000));
            let result = RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams::default(),
                pagination,
            )
            .await?;

            assert_eq!(result.len(), 0);
            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_fetch_limit_zero(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            // Use limit of 0
            let pagination = Pagination::new(Limit(0), Offset(0));
            let result = RecurringTransaction::fetch(
                &pool,
                &user,
                RecurringTransactionFetchParams::default(),
                pagination,
            )
            .await?;

            assert_eq!(result.len(), 0);
            Ok(())
        }
    }

    mod tests_get_by_id {
        use super::*;

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_get_by_id_basic(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            // Get the first transaction from fixtures: Weekly grocery shopping
            let result = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Failed to get transaction by id");

            assert_eq!(result.id, 1);
            assert_eq!(
                result.recurrence,
                Recurrence::Monthly {
                    month_from: YearMonth::new(2024, 1)?,
                    month_to: Some(YearMonth::new(2024, 12)?)
                }
            );
            assert!(result.is_expense);
            assert_eq!(result.amount, 1599);
            assert_eq!(result.description, Some("Netflix subscription".to_string()));
            assert_eq!(result.category_id, 4);
            assert_eq!(result.category, "Entertainment"); // From fixtures
            assert_eq!(result.shop_id, Some(6));
            assert_eq!(result.shop, Some("Netflix".to_string())); // From fixtures
            assert_eq!(result.user_id, user.id);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_get_by_id_wrong_user(pool: PgPool) -> anyhow::Result<()> {
            let user1 = get_user_by_id(&pool, 1).await;
            let user2 = get_user_by_id(&pool, 2).await;

            // Transaction ID 1 belongs to user 1, try to access it as user 2
            let result = RecurringTransaction::get_by_id(&pool, &user2, 1).await?;
            assert!(
                result.is_none(),
                "Should not be able to access another user's transaction"
            );

            // Verify that user 1 can still access their own transaction
            let result = RecurringTransaction::get_by_id(&pool, &user1, 1).await?;
            assert!(
                result.is_some(),
                "User 1 should be able to access their own transaction"
            );

            // Test accessing user 2's transaction as user 1
            let result = RecurringTransaction::get_by_id(&pool, &user1, 7).await?;
            assert!(
                result.is_none(),
                "User 1 should not be able to access user 2's transaction"
            );

            // Verify that user 2 can access their own transaction
            let result = RecurringTransaction::get_by_id(&pool, &user2, 7).await?;
            assert!(
                result.is_some(),
                "User 2 should be able to access their own transaction"
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_get_by_id_nonexistent_id(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            // Try to get a transaction with an ID that doesn't exist
            let result = RecurringTransaction::get_by_id(&pool, &user, 99999).await?;

            assert!(
                result.is_none(),
                "Should return None for nonexistent transaction ID"
            );

            Ok(())
        }
    }

    mod tests_update {
        use super::*;

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_nothing(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams::default(),
            )
            .await?
            .expect("Should return updated instance");

            // Note that updated_at shouldn't change either here
            assert_eq!(instance, updated_instance);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_recurrence_monthly(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            // this instance should have a yearly recurrence
            let instance = RecurringTransaction::get_by_id(&pool, &user, 14)
                .await?
                .expect("Should find instance created by fixtures");
            assert!(matches!(instance.recurrence, Recurrence::Yearly { .. }));

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                14,
                RecurringTransactionUpdateParams {
                    recurrence: Some(Recurrence::Monthly {
                        month_from: YearMonth::new(2026, 1)?,
                        month_to: None,
                    }),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                updated_instance,
                RecurringTransaction {
                    recurrence: Recurrence::Monthly {
                        month_from: YearMonth::new(2026, 1)?,
                        month_to: None,
                    },
                    updated_at: updated_instance.updated_at,
                    ..instance
                }
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 14)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_recurrence_year_to_null(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            // this instance should have a yearly recurrence
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");
            assert!(matches!(instance.recurrence, Recurrence::Monthly { .. }));

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    recurrence: Some(Recurrence::Yearly {
                        year_from: 2026,
                        year_to: None,
                    }),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                updated_instance,
                RecurringTransaction {
                    recurrence: Recurrence::Yearly {
                        year_from: 2026,
                        year_to: None,
                    },
                    updated_at: updated_instance.updated_at,
                    ..instance
                }
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_is_expense(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    is_expense: Some(false),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                RecurringTransaction {
                    is_expense: false,
                    updated_at: updated_instance.updated_at,
                    ..instance
                },
                updated_instance
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_amount(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");
            assert_eq!(instance.amount, 1599);

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    amount: Some(Amount(10000)),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                RecurringTransaction {
                    amount: 10000,
                    updated_at: updated_instance.updated_at,
                    ..instance
                },
                updated_instance
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_description_some(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");
            assert_eq!(
                instance.description,
                Some("Netflix subscription".to_string())
            );

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    description: JsonField::Defined(Some(Description(
                        "new description".to_string(),
                    ))),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                RecurringTransaction {
                    description: Some("new description".to_string()),
                    updated_at: updated_instance.updated_at,
                    ..instance
                },
                updated_instance
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_description_none(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");
            assert_eq!(
                instance.description,
                Some("Netflix subscription".to_string())
            );

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    description: JsonField::Defined(None),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                RecurringTransaction {
                    description: None,
                    updated_at: updated_instance.updated_at,
                    ..instance
                },
                updated_instance
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_valid_category_id(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    category_id: Some(UnvalidatedCategoryId::from(4)),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                RecurringTransaction {
                    category_id: 4,
                    category: "Entertainment".to_string(),
                    updated_at: updated_instance.updated_at,
                    ..instance
                },
                updated_instance
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_invalid_category_id(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    category_id: Some(UnvalidatedCategoryId::from(999999)),
                    ..Default::default()
                },
            )
            .await
            .expect_err("Shouldn't update with invalid category id");

            RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    category_id: Some(UnvalidatedCategoryId::from(14)),
                    ..Default::default()
                },
            )
            .await
            .expect_err("Shouldn't update with category id belonging to a different user");

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_valid_shop_id_some(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(4))),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                RecurringTransaction {
                    shop_id: Some(4),
                    shop: Some("Starbucks".to_string()),
                    updated_at: updated_instance.updated_at,
                    ..instance
                },
                updated_instance
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_valid_shop_id_none(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let instance = RecurringTransaction::get_by_id(&pool, &user, 1)
                .await?
                .expect("Should find instance created by fixtures");

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    shop_id: JsonField::Defined(None),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert_eq!(
                RecurringTransaction {
                    shop_id: None,
                    shop: None,
                    updated_at: updated_instance.updated_at,
                    ..instance
                },
                updated_instance
            );
            assert_eq!(
                RecurringTransaction::get_by_id(&pool, &user, 1)
                    .await?
                    .expect("Should fetch updated transaction"),
                updated_instance
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_invalid_shop_id(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(999999))),
                    ..Default::default()
                },
            )
            .await
            .expect_err("Shouldn't update with invalid shop id");

            RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    shop_id: JsonField::Defined(Some(UnvalidatedShopId::from(16))),
                    ..Default::default()
                },
            )
            .await
            .expect_err("Shouldn't update with shop id belonging to a different user");

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_updated_at_timestamp(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;
            let updated_at_before = sqlx::query_scalar!(
                "SELECT updated_at FROM recurring_transactions WHERE user_id = $1 AND id = $2",
                user.id,
                1
            )
            .fetch_one(&pool)
            .await?;

            // Wait a bit then update
            tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

            let updated_instance = RecurringTransaction::update(
                &pool,
                &user,
                1,
                RecurringTransactionUpdateParams {
                    amount: Some(Amount(10000)),
                    ..Default::default()
                },
            )
            .await?
            .expect("Should return updated instance");

            assert!(updated_at_before < updated_instance.updated_at);

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_other_users_transaction(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            let user_2_transaction = sqlx::query!(
                "SELECT id, description, updated_at FROM recurring_transactions WHERE user_id = $1",
                2
            )
            .fetch_one(&pool)
            .await?;

            assert!(
                RecurringTransaction::update(
                    &pool,
                    &user,
                    user_2_transaction.id,
                    RecurringTransactionUpdateParams {
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
                "SELECT id, description, updated_at FROM recurring_transactions WHERE id = $1",
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

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_update_nonexistent_transaction(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            assert!(
                RecurringTransaction::update(
                    &pool,
                    &user,
                    999999,
                    RecurringTransactionUpdateParams {
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
                sqlx::query_scalar!(
                    "SELECT COUNT(*) FROM recurring_transactions WHERE id = 999999"
                )
                .fetch_one(&pool)
                .await?,
                Some(0)
            );

            Ok(())
        }
    }

    mod tests_remove {
        use super::*;

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_remove_basic(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            // Delete the transaction (Weekly grocery shopping)
            let rows_affected = RecurringTransaction::remove(&pool, &user, 1).await?;
            assert_eq!(rows_affected, 1, "Should affect exactly 1 row");

            // Verify the transaction no longer exists
            let direct_query =
                sqlx::query!("SELECT id FROM recurring_transactions WHERE id = $1", 1)
                    .fetch_optional(&pool)
                    .await?;
            assert!(
                direct_query.is_none(),
                "Transaction should not exist in database after deletion"
            );

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_remove_wrong_user(pool: PgPool) -> anyhow::Result<()> {
            let user2 = get_user_by_id(&pool, 2).await;

            // Try to delete user 1's transaction as user 2 (should not work)
            let rows_affected = RecurringTransaction::remove(&pool, &user2, 1).await?;
            assert_eq!(
                rows_affected, 0,
                "Should not affect any rows when trying to delete another user's transaction"
            );

            // Verify user 1's transaction still exists
            sqlx::query!("SELECT id FROM recurring_transactions WHERE id = $1", 1)
                .fetch_optional(&pool)
                .await?
                .expect("User 1's transaction should still exist after rejected remove attempt");

            Ok(())
        }

        #[sqlx::test(fixtures("base", "recurring"))]
        fn test_remove_nonexistent_id(pool: PgPool) -> anyhow::Result<()> {
            let user = get_user_by_id(&pool, 1).await;

            // Try to delete a transaction with an ID that doesn't exist
            let rows_affected = RecurringTransaction::remove(&pool, &user, 99999).await?;
            assert_eq!(
                rows_affected, 0,
                "Should not affect any rows for nonexistent transaction ID"
            );

            Ok(())
        }
    }
}
