use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
use async_trait::async_trait;
use axum_login::{AuthUser, AuthnBackend, UserId};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use sqlx::{Pool, Postgres};
use tokio::task;
use validator::Validate;

// Validate minimum password length of 8 only for newly registered accounts
#[derive(Debug, Clone, Deserialize, Validate)]
pub struct RegisterCredentials {
    #[validate(length(min = 1))]
    pub username: String,
    #[validate(length(min = 8))]
    pub password: String,
}

#[derive(Debug, Clone, Deserialize, Validate)]
pub struct LoginCredentials {
    #[validate(length(min = 1))]
    pub username: String,
    #[validate(length(min = 1))]
    pub password: String,
}

#[derive(Clone)]
pub struct User {
    pub id: i32,
    pub username: String,
    pub hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Do not reveal password hash
impl std::fmt::Debug for User {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("User")
            .field("id", &self.id)
            .field("username", &self.username)
            .field("hash", &"[redacted]")
            .field("createdAt", &self.created_at)
            .field("updatedAt", &self.updated_at)
            .finish()
    }
}

impl AuthUser for User {
    type Id = i32;

    fn id(&self) -> Self::Id {
        self.id
    }

    fn session_auth_hash(&self) -> &[u8] {
        &self.hash.as_bytes()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),

    #[error(transparent)]
    Argon2(#[from] argon2::password_hash::Error),

    #[error(transparent)]
    TaskJoin(#[from] task::JoinError),
}

#[derive(Clone, Debug)]
pub struct Backend {
    pub database: Pool<Postgres>,
}

impl Backend {
    pub fn new(database: Pool<Postgres>) -> Self {
        Self { database }
    }
}

impl Backend {
    /// Create and return a new user with the given credentials, or return None if the username is already taken
    pub async fn create_user(
        &self,
        credentials: RegisterCredentials,
    ) -> Result<Option<User>, Error> {
        let salt = SaltString::generate(&mut OsRng);
        let hash = Argon2::default().hash_password(credentials.password.as_bytes(), &salt)?;

        let user = sqlx::query_as!(
            User,
            "INSERT INTO users (username, hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING RETURNING *",
            credentials.username.into(),
            hash.serialize().to_string()
        )
        .fetch_optional(&self.database)
        .await?;

        Ok(user)
    }
}

#[async_trait]
impl AuthnBackend for Backend {
    type User = User;
    type Credentials = LoginCredentials;
    type Error = Error;

    async fn authenticate(
        &self,
        credentials: Self::Credentials,
    ) -> Result<Option<Self::User>, Self::Error> {
        let user = sqlx::query_as!(
            User,
            "SELECT * FROM users WHERE username = $1",
            credentials.username
        )
        .fetch_optional(&self.database)
        .await?;

        let Some(user) = user else { return Ok(None) };

        // Verifying the password is blocking and potentially slow, so we'll do so via
        // `spawn_blocking`
        return task::spawn_blocking(move || {
            if PasswordHash::new(&user.hash).is_ok_and(|hash| {
                Argon2::default()
                    .verify_password(credentials.password.as_bytes(), &hash)
                    .is_ok()
            }) {
                Ok(Some(user))
            } else {
                Ok(None)
            }
        })
        .await?;
    }

    async fn get_user(&self, user_id: &UserId<Self>) -> Result<Option<Self::User>, Self::Error> {
        let user = sqlx::query_as!(User, "SELECT * FROM users WHERE id = $1", user_id)
            .fetch_optional(&self.database)
            .await?;

        Ok(user)
    }
}

#[cfg(test)]
mod tests {
    use anyhow::bail;
    use sqlx::types::chrono::DateTime;

    use super::*;

    #[test]
    fn test_register_credentials_validation() {
        assert!(
            RegisterCredentials {
                username: "user".into(),
                password: "longenough".into(),
            }
            .validate()
            .is_ok()
        );

        assert!(
            RegisterCredentials {
                username: "".into(),
                password: "longenough".into(),
            }
            .validate()
            .is_err()
        );

        assert!(
            RegisterCredentials {
                username: "user".into(),
                password: "short".into(),
            }
            .validate()
            .is_err()
        );
    }

    #[test]
    fn test_login_credentials_validation() {
        assert!(
            LoginCredentials {
                username: "user".into(),
                password: "any".into(),
            }
            .validate()
            .is_ok()
        );

        assert!(
            LoginCredentials {
                username: "".into(),
                password: "any".into(),
            }
            .validate()
            .is_err()
        );

        assert!(
            LoginCredentials {
                username: "user".into(),
                password: "".into(),
            }
            .validate()
            .is_err()
        );
    }

    #[test]
    fn test_user_debug() {
        let user = User {
            id: 0,
            username: "test".to_string(),
            hash: "secret_hash".to_string(),
            created_at: DateTime::UNIX_EPOCH,
            updated_at: DateTime::UNIX_EPOCH,
        };

        assert!(!format!("{user:?}").contains("secret_hash"));
    }

    #[sqlx::test]
    async fn test_create_user(pool: Pool<Postgres>) -> anyhow::Result<()> {
        let backend = Backend::new(pool);

        let creds = RegisterCredentials {
            username: "testuser".to_string(),
            password: "strongpassword".to_string(),
        };

        let result = backend.create_user(creds.clone()).await?;
        let Some(user) = result else {
            bail!("User was not created");
        };
        assert_eq!(user.username, creds.username);

        let result_2 = backend.create_user(creds).await?;
        assert!(result_2.is_none(), "User was created twice");

        Ok(())
    }

    #[sqlx::test]
    async fn test_authenticate_success(pool: Pool<Postgres>) -> anyhow::Result<()> {
        let backend = Backend::new(pool);

        let creds = RegisterCredentials {
            username: "auth_success".to_string(),
            password: "securepassword".to_string(),
        };

        backend
            .create_user(creds.clone())
            .await?
            .expect("User was not created");

        let user = backend
            .authenticate(LoginCredentials {
                username: creds.username,
                password: creds.password,
            })
            .await?;

        assert!(user.is_some(), "Expected authentication to succeed");
        Ok(())
    }

    #[sqlx::test]
    async fn test_authenticate_wrong_password(pool: Pool<Postgres>) -> anyhow::Result<()> {
        let backend = Backend::new(pool);

        let creds = RegisterCredentials {
            username: "auth_wrong_password".to_string(),
            password: "rightpassword".to_string(),
        };

        backend.create_user(creds.clone()).await?;

        let login = LoginCredentials {
            username: creds.username,
            password: "wrongpassword".to_string(),
        };

        let user = backend.authenticate(login).await?;
        assert!(
            user.is_none(),
            "Expected authentication to fail with wrong password"
        );

        Ok(())
    }

    #[sqlx::test]
    async fn test_authenticate_nonexistent_user(pool: Pool<Postgres>) -> anyhow::Result<()> {
        let backend = Backend::new(pool);

        let login = LoginCredentials {
            username: "ghostuser".to_string(),
            password: "whatever".to_string(),
        };

        let user = backend.authenticate(login).await?;
        assert!(
            user.is_none(),
            "Expected authentication to fail for nonexistent user"
        );

        Ok(())
    }

    #[sqlx::test]
    async fn test_get_user_success(pool: Pool<Postgres>) -> anyhow::Result<()> {
        let backend = Backend::new(pool);

        let creds = RegisterCredentials {
            username: "get_user_test".to_string(),
            password: "validpassword".to_string(),
        };

        let user = backend
            .create_user(creds)
            .await?
            .expect("Failed to create user");

        let fetched = backend.get_user(&user.id).await?;
        assert!(fetched.is_some(), "Expected to retrieve user by ID");
        assert_eq!(fetched.unwrap().username, user.username);

        Ok(())
    }

    #[sqlx::test]
    async fn test_get_user_not_found(pool: Pool<Postgres>) -> anyhow::Result<()> {
        let backend = Backend::new(pool);

        // Assumes ID 99999 does not exist
        let result = backend.get_user(&99999).await?;
        assert!(
            result.is_none(),
            "Expected no user to be found with non-existent ID"
        );

        Ok(())
    }
}
