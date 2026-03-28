use garde::Validate;
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Serialize, Validate)]
#[serde(transparent)]
#[garde(transparent)]
pub struct Limit(#[garde(range(min = 0))] pub i32);

impl Default for Limit {
    fn default() -> Self {
        Limit(1000)
    }
}

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, Validate)]
#[serde(transparent)]
#[garde(transparent)]
pub struct Offset(#[garde(range(min = 0))] pub i32);

#[derive(Clone, Copy, Debug, Default, Deserialize, Validate)]
pub struct Pagination {
    #[serde(default)]
    #[garde(dive)]
    pub limit: Limit,
    #[serde(default)]
    #[garde(dive)]
    pub offset: Offset,
}

impl Pagination {
    #[cfg(test)]
    pub fn new(limit: Limit, offset: Offset) -> Self {
        Pagination { limit, offset }
    }
}

#[cfg(test)]
mod tests {
    use garde::Validate;

    use super::*;

    #[test]
    fn test_validate_success() -> anyhow::Result<()> {
        Pagination::new(Limit(100), Offset(100)).validate()?;

        Ok(())
    }

    #[test]
    fn test_validate_fail() -> anyhow::Result<()> {
        Pagination::new(Limit(-2), Offset(100))
            .validate()
            .expect_err("Negative limit should cause an error");
        Pagination::new(Limit(100), Offset(-2))
            .validate()
            .expect_err("Negative offset should cause an error");

        Ok(())
    }
}
