use std::ops::Deref;

use axum::http::StatusCode;
use garde::Validate;
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

use crate::{
    app::resources::{
        Resource,
        categories_shops::{Category, Shop},
    },
    errors::ServerError,
    users::User,
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

#[derive(Clone, Debug, Deserialize, Serialize, Validate)]
#[serde(transparent)]
#[garde(transparent)]
pub struct UnvalidatedCategoryId(#[garde(range(min = 1))] i32);

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

#[derive(Clone, Debug, Deserialize, Serialize, Validate)]
#[serde(transparent)]
#[garde(transparent)]
pub struct UnvalidatedShopId(#[garde(range(min = 1))] i32);

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

#[derive(Clone, Debug, Deserialize, Serialize, Validate)]
#[serde(transparent)]
#[garde(transparent)]
pub struct Description(#[garde(length(graphemes, min = 1))] pub String);

impl Deref for Description {
    type Target = String;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, Validate)]
#[serde(transparent)]
#[garde(transparent)]
pub struct Amount(#[garde(range(min = 1))] pub i32);

impl Deref for Amount {
    type Target = i32;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
