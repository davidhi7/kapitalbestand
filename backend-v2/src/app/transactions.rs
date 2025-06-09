use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{
    app::resources::{
        Resource,
        categories_shops::{Category, Shop},
    },
    errors::ServerError,
    users::User,
    validate_newtype_range,
};

#[derive(Clone, Debug, Default, Deserialize)]
pub enum Ordering {
    #[default]
    Asc,
    Desc,
}

#[derive(Clone, Debug, Default, Deserialize)]
pub enum OrderKey {
    #[default]
    Time,
    Amount,
    Category,
    Shop,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(transparent)]
pub struct UnvalidatedCategoryId(i32);

impl UnvalidatedCategoryId {
    #[cfg(test)]
    pub fn from(id: i32) -> Self {
        Self(id)
    }

    pub async fn validate(self, user: &User, database: &PgPool) -> Result<i32, ServerError> {
        match Category::get_by_id(database, user, self.0).await? {
            Some(_) => Ok(self.0),
            None => Err(ServerError::Generic(
                StatusCode::BAD_REQUEST,
                Some("Invalid category id".to_owned()),
            )),
        }
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(transparent)]
pub struct UnvalidatedShopId(i32);

impl UnvalidatedShopId {
    #[cfg(test)]
    pub fn from(id: i32) -> Self {
        Self(id)
    }

    pub async fn validate(self, user: &User, database: &PgPool) -> Result<i32, ServerError> {
        match Shop::get_by_id(database, user, self.0).await? {
            Some(_) => Ok(self.0),
            None => Err(ServerError::Generic(
                StatusCode::BAD_REQUEST,
                Some("Invalid shop id".to_owned()),
            )),
        }
    }
}

validate_newtype_range!(UnvalidatedCategoryId, i32);
validate_newtype_range!(UnvalidatedShopId, i32);
