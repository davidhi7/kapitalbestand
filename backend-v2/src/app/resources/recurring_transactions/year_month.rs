use std::fmt::{self, Display};

use chrono::NaiveDate;
use garde::{Report, Validate};
use serde::{Deserialize, Deserializer, Serialize, Serializer, de::Visitor};

#[derive(Clone, Debug, PartialEq, Eq, Validate)]
pub struct YearMonth {
    #[garde(skip)]
    pub year: i32,
    #[garde(range(min = 1, max = 12))]
    pub month: u32,
}

impl YearMonth {
    /// Allowed month values range from 1 to 12.
    pub fn new(year: i32, month: u32) -> Result<Self, Report> {
        let instance = Self { year, month };
        instance.validate()?;
        Ok(instance)
    }

    pub fn to_naive_date(&self) -> NaiveDate {
        NaiveDate::from_ymd_opt(self.year, self.month, 1)
            .expect("Couldn't create NaiveDate from validated YearMonth")
    }
}

impl Display for YearMonth {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{:0>4}-{:0>2}", self.year, self.month)
    }
}

impl Serialize for YearMonth {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let formatted = format!("{:04}-{:02}", self.year, self.month);
        serializer.serialize_str(&formatted)
    }
}

struct YearMonthVisitor;

impl<'de> Visitor<'de> for YearMonthVisitor {
    type Value = YearMonth;

    fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        formatter.write_str("a string in YYYY-MM format")
    }

    fn visit_str<E>(self, value: &str) -> Result<Self::Value, E>
    where
        E: serde::de::Error,
    {
        let parts: Vec<&str> = value.split('-').collect();

        if parts.len() != 2 {
            return Err(E::custom(format!(
                "invalid format '{}', expected YYYY-MM",
                value
            )));
        }

        let Ok(year) = parts[0].parse::<i32>() else {
            return Err(E::custom(format!(
                "invalid year '{}', must be a valid integer",
                parts[0],
            )));
        };

        let Ok(month) = parts[1].parse::<u32>() else {
            return Err(E::custom(format!(
                "invalid month '{}', must be a valid integer",
                parts[1]
            )));
        };

        // Validation is later done in the handler
        Ok(YearMonth { year, month })
    }
}

impl<'de> Deserialize<'de> for YearMonth {
    fn deserialize<D>(deserializer: D) -> Result<YearMonth, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_str(YearMonthVisitor)
    }
}
