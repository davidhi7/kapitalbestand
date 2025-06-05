use serde::{Deserialize, Serialize};
use validator::Validate;

#[macro_export]
macro_rules! validate_newtype_range {
    ($type:ty, $numeric_type:ty) => {
        impl validator::ValidateRange<$numeric_type> for $type {
            fn greater_than(&self, max: $numeric_type) -> Option<bool> {
                Some(self.0 > max)
            }

            fn less_than(&self, min: $numeric_type) -> Option<bool> {
                Some(self.0 < min)
            }
        }
    };
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(transparent)]
pub struct Limit(pub i32);

impl Default for Limit {
    fn default() -> Self {
        Limit(1000)
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
#[serde(transparent)]
pub struct Offset(pub i32);

validate_newtype_range!(Limit, i32);
validate_newtype_range!(Offset, i32);

#[derive(Clone, Copy, Debug, Default, Deserialize, Validate)]
pub struct Pagination {
    #[serde(default)]
    #[validate(range(min = 0))]
    pub limit: Limit,
    #[serde(default)]
    #[validate(range(min = 0))]
    pub offset: Offset,
}

impl Pagination {
    #[cfg(test)]
    pub fn new(limit: Limit, offset: Offset) -> Self {
        Pagination { limit, offset }
    }
}
