use serde::{Deserialize, Serialize};
use validator::{Validate, ValidateRange};

#[derive(Clone, Copy, Debug, Deserialize, Serialize)]
#[serde(transparent)]
pub struct Limit(pub i32);

impl Default for Limit {
    fn default() -> Self {
        Limit(1000)
    }
}

impl ValidateRange<i32> for Limit {
    fn greater_than(&self, max: i32) -> Option<bool> {
        Some(self.0 > max)
    }

    fn less_than(&self, min: i32) -> Option<bool> {
        Some(self.0 < min)
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize)]
#[serde(transparent)]
pub struct Offset(pub i32);

impl ValidateRange<i32> for Offset {
    fn greater_than(&self, max: i32) -> Option<bool> {
        Some(self.0 > max)
    }

    fn less_than(&self, min: i32) -> Option<bool> {
        Some(self.0 < min)
    }
}

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
