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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, FromRow)]
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
        user: &User,
        params: Self::CreateParams,
    ) -> Result<Option<Self::ReturnType>, Self::Error> {
        sqlx::query_as!(
            Category,
            "INSERT INTO categories (user_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *", 
            user.id,
            params.name
        )
        .fetch_optional(database)
        .await
    }

    async fn fetch(
        database: &PgPool,
        user: &User,
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
        user: &User,
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
        user: &User,
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

    async fn remove(database: &sqlx::PgPool, user: &User, id: i32) -> Result<u64, Self::Error> {
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

#[derive(Debug, Clone, PartialEq, Eq, Serialize, FromRow)]
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
        user: &User,
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
        user: &User,
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
        user: &User,
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
        user: &User,
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

    async fn remove(database: &sqlx::PgPool, user: &User, id: i32) -> Result<u64, Self::Error> {
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

#[cfg(test)]
mod category_tests {
    use super::*;
    use crate::app::api::{Limit, Offset, Pagination};
    use crate::users::User;
    use sqlx::PgPool;

    async fn get_user_by_id(pool: &PgPool, id: i32) -> User {
        sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
            .fetch_one(pool)
            .await
            .expect("Failed to get user")
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_category_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopCreate {
            name: "New Test Category".to_string(),
        };

        let category = Category::create(&pool, &user, params)
            .await?
            .expect("Failed to create category");

        assert_eq!(category.name, "New Test Category");
        assert_eq!(category.user_id, user.id);
        assert!(category.id > 0);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_category_duplicate_same_user(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopCreate {
            name: "Groceries".to_string(), // Already exists for user 1
        };

        let result = Category::create(&pool, &user, params).await?;

        // Should return None due to ON CONFLICT DO NOTHING
        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_category_duplicate_different_user(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 2).await; // Bob
        let params = CategoryShopCreate {
            name: "Groceries".to_string(), // Exists for Alice but not Bob
        };

        let category = Category::create(&pool, &user, params)
            .await?
            .expect("Failed to create category");

        assert_eq!(category.name, "Groceries");
        assert_eq!(category.user_id, user.id);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_category_with_special_characters(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopCreate {
            name: "Café".to_string(),
        };

        let category = Category::create(&pool, &user, params)
            .await?
            .expect("Failed to create category");

        assert_eq!(category.name, "Café");

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_categories_no_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice has many categories

        let categories = Category::fetch(
            &pool,
            &user,
            CategoryShopFetch { name: None },
            Pagination::default(),
        )
        .await?;

        assert!(
            !categories.is_empty(),
            "Fixture data problem: User 1 should have at least one shop for this test."
        );

        // All categories should belong to the user
        for category in &categories {
            assert_eq!(category.user_id, user.id);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_categories_with_name_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopFetch {
            name: Some("Groceries".to_string()),
        };

        let categories = Category::fetch(&pool, &user, params, Pagination::default()).await?;

        assert_eq!(categories.len(), 1);
        assert_eq!(categories[0].name, "Groceries");
        assert_eq!(categories[0].user_id, user.id);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_categories_nonexistent_name(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let categories = Category::fetch(
            &pool,
            &user,
            CategoryShopFetch {
                name: Some("NonExistentCategory".to_string()),
            },
            Pagination::default(),
        )
        .await?;

        assert!(categories.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_categories_pagination_limit(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice has many categories
        let params = CategoryShopFetch { name: None };
        let pagination = Pagination::new(Limit(3), Offset(0));

        let categories = Category::fetch(&pool, &user, params, pagination).await?;

        assert!(categories.len() == 3);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_categories_pagination_offset(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Get first batch
        let categories_1 = Category::fetch(
            &pool,
            &user,
            CategoryShopFetch { name: None },
            Pagination::new(Limit(5), Offset(0)),
        )
        .await?;

        // Get second batch with offset
        let categories_2 = Category::fetch(
            &pool,
            &user,
            CategoryShopFetch { name: None },
            Pagination::new(Limit(5), Offset(5)),
        )
        .await?;

        assert!(
            !categories_1.is_empty(),
            "Fixture data problem: First set should not be empty"
        );
        assert!(
            !categories_2.is_empty(),
            "Fixture data problem: Second set should not be empty"
        );

        let ids1: Vec<i32> = categories_1.iter().map(|c| c.id).collect();
        let ids2: Vec<i32> = categories_2.iter().map(|c| c.id).collect();

        for id in ids2.iter() {
            assert!(!ids1.contains(id));
        }

        for id in ids1 {
            assert!(!ids2.contains(&id));
        }

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_categories_user_isolation(pool: PgPool) -> anyhow::Result<()> {
        let user1 = get_user_by_id(&pool, 1).await; // Alice
        let user2 = get_user_by_id(&pool, 2).await; // Bob
        let params = CategoryShopFetch { name: None };

        let categories_1 =
            Category::fetch(&pool, &user1, params.clone(), Pagination::default()).await?;
        let categories_2 = Category::fetch(&pool, &user2, params, Pagination::default()).await?;

        // All categories should belong to their respective users
        for category in &categories_1 {
            assert_eq!(category.user_id, user1.id);
        }
        for category in &categories_2 {
            assert_eq!(category.user_id, user2.id);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_get_by_id_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // First, get a category to test with
        let existing_category = sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE user_id = $1 AND name = $2",
            user.id,
            "Groceries"
        )
        .fetch_one(&pool)
        .await?;

        let fetched_category = Category::get_by_id(&pool, &user, existing_category.id)
            .await?
            .expect("Category not found by ID");

        assert_eq!(fetched_category, existing_category);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_get_by_id_nonexistent(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let result = Category::get_by_id(&pool, &user, 99999).await?;

        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_get_by_id_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user2 = get_user_by_id(&pool, 2).await;

        let category = sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE user_id = $1 LIMIT 1",
            1
        )
        .fetch_one(&pool)
        .await?;

        // Try to access it with user2
        let result = Category::get_by_id(&pool, &user2, category.id).await?;

        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_category_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Get a category to update
        let original_category = sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE user_id = $1 LIMIT 1",
            user.id
        )
        .fetch_one(&pool)
        .await?;

        let updated_category = Category::update(
            &pool,
            &user,
            original_category.id,
            CategoryShopCreate {
                name: "Updated Groceries".to_string(),
            },
        )
        .await?
        .expect("Failed to update category");

        assert_eq!(updated_category.id, original_category.id);
        assert_eq!(updated_category.name, "Updated Groceries");
        assert_eq!(updated_category.user_id, user.id);
        assert_eq!(updated_category.created_at, original_category.created_at);
        assert!(updated_category.updated_at > original_category.updated_at);

        // Verify the change persisted
        let fetched = Category::get_by_id(&pool, &user, original_category.id)
            .await?
            .expect("Category not found after update");
        assert_eq!(fetched.name, "Updated Groceries");

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_category_nonexistent(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let result = Category::update(
            &pool,
            &user,
            99999,
            CategoryShopCreate {
                name: "Should Not Update".to_string(),
            },
        )
        .await?;

        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_category_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user1 = get_user_by_id(&pool, 1).await;
        let user2 = get_user_by_id(&pool, 2).await;

        // Get a category from user1
        let category = sqlx::query_as!(
            Category,
            "SELECT * FROM categories WHERE user_id = $1 LIMIT 1",
            1
        )
        .fetch_one(&pool)
        .await?;

        // Try to update with user2
        let updated_category_option = Category::update(
            &pool,
            &user2,
            category.id,
            CategoryShopCreate {
                name: "Hacked Update".to_string(),
            },
        )
        .await?;

        assert!(updated_category_option.is_none()); // Should not update

        // Verify original category is unchanged
        let original = Category::get_by_id(&pool, &user1, category.id)
            .await?
            .expect("Original category not found when it should exist");
        assert_eq!(original, category);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_category_with_special_characters(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let created = Category::create(
            &pool,
            &user,
            CategoryShopCreate {
                name: "Test Category".to_string(),
            },
        )
        .await?
        .expect("Failed to create category");

        let updated_category = Category::update(
            &pool,
            &user,
            created.id,
            CategoryShopCreate {
                name: "Updated with Special Chars: Café".to_string(),
            },
        )
        .await?
        .expect("Failed to update category and fetch new instance");

        assert_eq!(updated_category.name, "Updated with Special Chars: Café");

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_remove_category_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let created = Category::create(
            &pool,
            &user,
            CategoryShopCreate {
                name: "Category To Delete".to_string(),
            },
        )
        .await?
        .expect("Failed to create category");

        assert_eq!(Category::remove(&pool, &user, created.id).await?, 1u64);

        // Verify it's deleted
        let fetched_option = Category::get_by_id(&pool, &user, created.id).await?;
        assert!(fetched_option.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_remove_category_nonexistent(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        assert_eq!(Category::remove(&pool, &user, 99999).await?, 0);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_remove_category_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user1 = get_user_by_id(&pool, 1).await;
        let user2 = get_user_by_id(&pool, 2).await;

        // Get a category from user1
        let categories = Category::fetch(
            &pool,
            &user1,
            CategoryShopFetch { name: None },
            Pagination::new(Limit(1), Offset(0)),
        )
        .await?;
        assert_eq!(
            categories.len(),
            1,
            "Fixture data problem: User 1 should have at least one category for this test."
        );
        let category = &categories[0];

        // Try to delete with user2, should not delete
        assert_eq!(Category::remove(&pool, &user2, category.id).await?, 0);

        // Verify category still exists for user1
        let original_category = Category::get_by_id(&pool, &user1, category.id)
            .await?
            .expect("Failed to find category");
        assert_eq!(&original_category, category);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_category_timestamps(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let before_create = Utc::now();

        // Create category
        let created = Category::create(
            &pool,
            &user,
            CategoryShopCreate {
                name: "Timestamp Test".to_string(),
            },
        )
        .await?
        .expect("Failed to create category");

        let after_create = Utc::now();

        // Check created_at and updated_at are reasonable
        assert!(created.created_at >= before_create);
        assert!(created.created_at <= after_create);
        assert_eq!(created.created_at, created.updated_at); // Should be same on create

        // Wait a bit then update
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        let before_update = Utc::now();

        let updated = Category::update(
            &pool,
            &user,
            created.id,
            CategoryShopCreate {
                name: "Updated Timestamp Test".to_string(),
            },
        )
        .await?
        .expect("Failed to update category");

        let after_update = Utc::now();

        // Check updated_at changed but created_at didn't
        assert_eq!(updated.created_at, created.created_at); // Should not change
        assert!(updated.updated_at >= before_update);
        assert!(updated.updated_at <= after_update);
        assert!(updated.updated_at > created.updated_at); // Should be newer

        Ok(())
    }
}

#[cfg(test)]
mod shop_tests {
    use super::*;
    use crate::app::api::{Limit, Offset, Pagination};
    use crate::users::User;
    use sqlx::PgPool;

    async fn get_user_by_id(pool: &PgPool, id: i32) -> User {
        sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", id)
            .fetch_one(pool)
            .await
            .expect("Failed to get user")
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_shop_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopCreate {
            name: "New Test Shop".to_string(),
        };

        let shop = Shop::create(&pool, &user, params)
            .await?
            .expect("Failed to create shop");

        assert_eq!(shop.name, "New Test Shop");
        assert_eq!(shop.user_id, user.id);
        assert!(shop.id > 0);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_shop_duplicate_same_user(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopCreate {
            name: "Whole Foods".to_string(), // Already exists for user 1
        };

        let result = Shop::create(&pool, &user, params).await?;

        // Should return None due to ON CONFLICT DO NOTHING
        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_shop_duplicate_different_user(pool: PgPool) -> anyhow::Result<()> {
        let user2 = get_user_by_id(&pool, 2).await; // Bob
        let params = CategoryShopCreate {
            name: "Whole Foods".to_string(), // Exists for Alice but not Bob
        };

        let shop = Shop::create(&pool, &user2, params)
            .await?
            .expect("Failed to create shop");

        assert_eq!(shop.name, "Whole Foods");
        assert_eq!(shop.user_id, user2.id);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_create_shop_with_special_characters(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopCreate {
            name: "Café".to_string(),
        };

        let shop = Shop::create(&pool, &user, params)
            .await?
            .expect("Failed to create shop");

        assert_eq!(shop.name, "Café");

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_shops_no_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice has many shops

        let shops = Shop::fetch(
            &pool,
            &user,
            CategoryShopFetch { name: None },
            Pagination::default(),
        )
        .await?;

        assert!(
            !shops.is_empty(),
            "Fixture data problem: User 1 should have at least one shop for this test."
        );

        // All shops should belong to the user
        for shop in &shops {
            assert_eq!(shop.user_id, user.id);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_shops_with_name_filter(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let params = CategoryShopFetch {
            name: Some("Whole Foods".to_string()),
        };

        let shops = Shop::fetch(&pool, &user, params, Pagination::default()).await?;

        assert_eq!(shops.len(), 1);
        assert_eq!(shops[0].name, "Whole Foods");
        assert_eq!(shops[0].user_id, user.id);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_shops_nonexistent_name(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let shops = Shop::fetch(
            &pool,
            &user,
            CategoryShopFetch {
                name: Some("NonExistentShop".to_string()),
            },
            Pagination::default(),
        )
        .await?;

        assert!(shops.is_empty());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_shops_pagination_limit(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await; // Alice has many shops
        let params = CategoryShopFetch { name: None };
        let pagination = Pagination::new(Limit(3), Offset(0));

        let shops = Shop::fetch(&pool, &user, params, pagination).await?;

        assert!(shops.len() == 3);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_shops_pagination_offset(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Get first batch
        let shops_1 = Shop::fetch(
            &pool,
            &user,
            CategoryShopFetch { name: None },
            Pagination::new(Limit(5), Offset(0)),
        )
        .await?;

        // Get second batch with offset
        let shops_2 = Shop::fetch(
            &pool,
            &user,
            CategoryShopFetch { name: None },
            Pagination::new(Limit(5), Offset(5)),
        )
        .await?;

        assert!(
            !shops_1.is_empty(),
            "Fixture data problem: First set should not be empty"
        );
        assert!(
            !shops_2.is_empty(),
            "Fixture data problem: Second set should not be empty"
        );

        let ids1: Vec<i32> = shops_1.iter().map(|c| c.id).collect();
        let ids2: Vec<i32> = shops_2.iter().map(|c| c.id).collect();

        for id in ids2.iter() {
            assert!(!ids1.contains(id));
        }

        for id in ids1 {
            assert!(!ids2.contains(&id));
        }

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_fetch_shops_user_isolation(pool: PgPool) -> anyhow::Result<()> {
        let user1 = get_user_by_id(&pool, 1).await; // Alice
        let user2 = get_user_by_id(&pool, 2).await; // Bob
        let params = CategoryShopFetch { name: None };

        let shops_1 = Shop::fetch(&pool, &user1, params.clone(), Pagination::default()).await?;
        let shops_2 = Shop::fetch(&pool, &user2, params, Pagination::default()).await?;

        // All shops should belong to their respective users
        for shop in &shops_1 {
            assert_eq!(shop.user_id, user1.id);
        }
        for shop in &shops_2 {
            assert_eq!(shop.user_id, user2.id);
        }

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_get_shop_by_id_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // First, get a shop to test with
        let existing_shop = sqlx::query_as!(
            Shop,
            "SELECT * FROM shops WHERE user_id = $1 AND name = $2",
            user.id,
            "Whole Foods"
        )
        .fetch_one(&pool)
        .await?;

        let fetched_shop = Shop::get_by_id(&pool, &user, existing_shop.id)
            .await?
            .expect("Shop not found by ID");

        assert_eq!(fetched_shop, existing_shop);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_get_shop_by_id_nonexistent(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let result = Shop::get_by_id(&pool, &user, 99999).await?;

        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_get_shop_by_id_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user2 = get_user_by_id(&pool, 2).await; // Bob

        let shop = sqlx::query_as!(Shop, "SELECT * FROM shops WHERE user_id = $1 LIMIT 1", 1)
            .fetch_one(&pool)
            .await?;

        // Try to access it with user2
        let result = Shop::get_by_id(&pool, &user2, shop.id).await?;

        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_shop_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        // Get a shop to update
        let original_shop = sqlx::query_as!(
            Shop,
            "SELECT * FROM shops WHERE user_id = $1 LIMIT 1",
            user.id
        )
        .fetch_one(&pool)
        .await?;

        let updated_shop = Shop::update(
            &pool,
            &user,
            original_shop.id,
            CategoryShopCreate {
                name: "Updated Shop Name".to_string(),
            },
        )
        .await?
        .expect("Failed to update shop");

        assert_eq!(updated_shop.id, original_shop.id);
        assert_eq!(updated_shop.name, "Updated Shop Name");
        assert_eq!(updated_shop.user_id, user.id);
        assert_eq!(updated_shop.created_at, original_shop.created_at);
        assert!(updated_shop.updated_at > original_shop.updated_at);

        // Verify the change persisted
        let fetched = Shop::get_by_id(&pool, &user, original_shop.id)
            .await?
            .expect("Shop not found after update");
        assert_eq!(fetched.name, "Updated Shop Name");

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_shop_nonexistent(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let result = Shop::update(
            &pool,
            &user,
            99999,
            CategoryShopCreate {
                name: "Should Not Update".to_string(),
            },
        )
        .await?;

        assert!(result.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_shop_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user1 = get_user_by_id(&pool, 1).await;
        let user2 = get_user_by_id(&pool, 2).await;

        // Get a shop from user1
        let shop = sqlx::query_as!(Shop, "SELECT * FROM shops WHERE user_id = $1 LIMIT 1", 1)
            .fetch_one(&pool)
            .await?;

        // Try to update with user2
        let updated_shop_option = Shop::update(
            &pool,
            &user2,
            shop.id,
            CategoryShopCreate {
                name: "Hacked Update".to_string(),
            },
        )
        .await?;

        assert!(updated_shop_option.is_none()); // Should not update

        // Verify original shop is unchanged
        let original = Shop::get_by_id(&pool, &user1, shop.id)
            .await?
            .expect("Original shop not found when it should exist");
        assert_eq!(original, shop);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_update_shop_with_special_characters(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let created = Shop::create(
            &pool,
            &user,
            CategoryShopCreate {
                name: "Test Shop".to_string(),
            },
        )
        .await?
        .expect("Failed to create shop");

        let updated_shop = Shop::update(
            &pool,
            &user,
            created.id,
            CategoryShopCreate {
                name: "Updated Shop: Café & Stuff (100%)".to_string(),
            },
        )
        .await?
        .expect("Failed to update shop and fetch new instance");

        assert_eq!(updated_shop.name, "Updated Shop: Café & Stuff (100%)");

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_remove_shop_success(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        let created = Shop::create(
            &pool,
            &user,
            CategoryShopCreate {
                name: "Shop To Delete".to_string(),
            },
        )
        .await?
        .expect("Failed to create shop");

        assert_eq!(Shop::remove(&pool, &user, created.id).await?, 1u64);

        // Verify it's deleted
        let fetched_option = Shop::get_by_id(&pool, &user, created.id).await?;
        assert!(fetched_option.is_none());

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_remove_shop_nonexistent(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;

        assert_eq!(Shop::remove(&pool, &user, 99999).await?, 0);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_remove_shop_wrong_user(pool: PgPool) -> anyhow::Result<()> {
        let user1 = get_user_by_id(&pool, 1).await;
        let user2 = get_user_by_id(&pool, 2).await;

        // Get a shop from user1
        let shops = Shop::fetch(
            &pool,
            &user1,
            CategoryShopFetch { name: None },
            Pagination::new(Limit(1), Offset(0)),
        )
        .await?;
        assert_eq!(
            shops.len(),
            1,
            "Fixture data problem: User 1 should have at least one shop for this test."
        );
        let shop = &shops[0];

        // Try to delete with user2, should not delete
        assert_eq!(Shop::remove(&pool, &user2, shop.id).await?, 0);

        // Verify shop still exists for user1
        let original_shop = Shop::get_by_id(&pool, &user1, shop.id)
            .await?
            .expect("Failed to find shop");
        assert_eq!(&original_shop, shop);

        Ok(())
    }

    #[sqlx::test(fixtures("base"))]
    async fn test_shop_timestamps(pool: PgPool) -> anyhow::Result<()> {
        let user = get_user_by_id(&pool, 1).await;
        let before_create = Utc::now();

        // Create shop
        let created = Shop::create(
            &pool,
            &user,
            CategoryShopCreate {
                name: "Timestamp Test Shop".to_string(),
            },
        )
        .await?
        .expect("Failed to create shop for timestamp test");

        let after_create = Utc::now();

        // Check created_at and updated_at are reasonable
        assert!(created.created_at >= before_create);
        assert!(created.created_at <= after_create);
        assert_eq!(created.created_at, created.updated_at); // Should be same on create

        // Wait a bit then update
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        let before_update = Utc::now();

        let updated = Shop::update(
            &pool,
            &user,
            created.id,
            CategoryShopCreate {
                name: "Updated Timestamp Shop".to_string(),
            },
        )
        .await?
        .expect("Failed to update shop");

        let after_update = Utc::now();

        // Check updated_at changed but created_at didn't
        assert_eq!(updated.created_at, created.created_at); // Should not change
        assert!(updated.updated_at >= before_update);
        assert!(updated.updated_at <= after_update);
        assert!(updated.updated_at > created.updated_at,); // Should be newer

        Ok(())
    }
}
