use axum::http::StatusCode;
use serde::Deserialize;

use crate::errors::ServerError;

/// Wire-level filter mode for a nullable column, sent as its own query param.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FilterMode {
    Null,
    Specific,
}

/// Resolved filter over a nullable column.
pub enum ColumnFilter<T> {
    Any,
    Null,
    Specific(T),
}

impl<T> ColumnFilter<T> {
    /// Combine a `<field>Filter` mode with its companion `<field>Id` value, requiring the id iff the mode is `Specific`.
    pub fn resolve(
        mode: Option<FilterMode>,
        id: Option<T>,
        field: &str,
    ) -> Result<Self, ServerError> {
        match (mode, id) {
            (None, None) => Ok(Self::Any),
            (Some(FilterMode::Null), None) => Ok(Self::Null),
            (Some(FilterMode::Specific), Some(id)) => Ok(Self::Specific(id)),
            (Some(FilterMode::Specific), None) => Err(ServerError::Generic(
                StatusCode::BAD_REQUEST,
                Some(format!("`{field}Id` is required when `{field}Filter=specific`")),
            )),
            (_, Some(_)) => Err(ServerError::Generic(
                StatusCode::BAD_REQUEST,
                Some(format!(
                    "`{field}Id` is only allowed when `{field}Filter=specific`"
                )),
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{ColumnFilter, FilterMode};

    #[test]
    fn resolve_covers_all_arms() {
        assert!(matches!(
            ColumnFilter::<i32>::resolve(None, None, "shop"),
            Ok(ColumnFilter::Any)
        ));
        assert!(matches!(
            ColumnFilter::<i32>::resolve(Some(FilterMode::Null), None, "shop"),
            Ok(ColumnFilter::Null)
        ));
        assert!(matches!(
            ColumnFilter::resolve(Some(FilterMode::Specific), Some(7), "shop"),
            Ok(ColumnFilter::Specific(7))
        ));
        assert!(ColumnFilter::<i32>::resolve(Some(FilterMode::Specific), None, "shop").is_err());
        assert!(ColumnFilter::resolve(None, Some(7), "shop").is_err());
        assert!(ColumnFilter::resolve(Some(FilterMode::Null), Some(7), "shop").is_err());
    }
}
