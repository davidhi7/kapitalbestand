use garde::Validate;
use serde::{Deserialize, Serialize};
use sqlx::Type;

use crate::app::resources::recurring_transactions::year_month::YearMonth;

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize, Type)]
#[serde(rename_all = "camelCase")]
#[sqlx(type_name = "recurrence_frequency", rename_all = "lowercase")]
pub enum RecurrenceFrequency {
    Monthly,
    Yearly,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize, Validate)]
#[serde(
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    tag = "frequency",
    deny_unknown_fields
)]
pub enum Recurrence {
    Yearly {
        #[garde(skip)]
        year_from: i32,
        #[garde(custom(validate_year_range(self)))]
        year_to: Option<i32>,
    },
    Monthly {
        #[garde(dive)]
        month_from: YearMonth,
        #[garde(dive, custom(validate_month_range(self)))]
        month_to: Option<YearMonth>,
    },
}

fn validate_year_range(context: &Recurrence) -> impl FnOnce(&Option<i32>, &()) -> garde::Result {
    move |value, _| {
        let Some(year_to) = value else {
            return Ok(());
        };

        match context {
            Recurrence::Yearly { year_from, .. } => {
                if year_to < year_from {
                    return Err(garde::Error::new(format!(
                        "less than year_from={year_from}"
                    )));
                }
            }
            Recurrence::Monthly { .. } => unreachable!(),
        }
        Ok(())
    }
}

fn validate_month_range(
    context: &Recurrence,
) -> impl FnOnce(&Option<YearMonth>, &()) -> garde::Result {
    move |value, _| {
        let Some(month_to) = value else {
            return Ok(());
        };

        match context {
            Recurrence::Monthly { month_from, .. } => {
                if month_to.year < month_from.year
                    || (month_to.year == month_from.year && month_to.month < month_from.month)
                {
                    return Err(garde::Error::new(format!(
                        "less than month_from={}",
                        month_from
                    )));
                }
            }
            Recurrence::Yearly { .. } => unreachable!(),
        }
        Ok(())
    }
}

// impl From<Recurrence> for NaiveDate {
//     fn from(value: Recurrence) -> Self {
//         match value {
//             Recurrence::Yearly { year_from, year_to } => NaiveDate::from_isoywd_opt(year, week, weekday),
//             Recurrence::Monthly { month_from, month_to } => todo!(),
//         }
//     }
// }

#[cfg(test)]
mod tests {
    use super::*;

    fn year_month(year: i32, month: u32) -> YearMonth {
        YearMonth { year, month }
    }

    #[test]
    fn test_yearly_recurrence_valid() {
        Recurrence::Yearly {
            year_from: 2020,
            year_to: Some(2025),
        }
        .validate()
        .expect("Valid range");

        Recurrence::Yearly {
            year_from: 2023,
            year_to: Some(2023),
        }
        .validate()
        .expect("Same year");

        Recurrence::Yearly {
            year_from: 2020,
            year_to: None,
        }
        .validate()
        .expect("No end year");

        Recurrence::Yearly {
            year_from: -100,
            year_to: Some(100),
        }
        .validate()
        .expect("Negative years");
    }

    #[test]
    fn test_yearly_recurrence_invalid() {
        Recurrence::Yearly {
            year_from: 2025,
            year_to: Some(2020),
        }
        .validate()
        .expect_err("Invalid range");
    }

    #[test]
    fn test_monthly_recurrence_valid() {
        Recurrence::Monthly {
            month_from: year_month(2020, 3),
            month_to: Some(year_month(2021, 5)),
        }
        .validate()
        .expect("Valid range different years");

        Recurrence::Monthly {
            month_from: year_month(2023, 3),
            month_to: Some(year_month(2023, 8)),
        }
        .validate()
        .expect("Valid range same year");

        Recurrence::Monthly {
            month_from: year_month(2023, 6),
            month_to: Some(year_month(2023, 6)),
        }
        .validate()
        .expect("Same year and month");

        Recurrence::Monthly {
            month_from: year_month(2023, 1),
            month_to: None,
        }
        .validate()
        .expect("No end month");

        Recurrence::Monthly {
            month_from: year_month(2023, 12),
            month_to: Some(year_month(2024, 1)),
        }
        .validate()
        .expect("Year boundary transition");
    }

    #[test]
    fn test_monthly_recurrence_invalid() {
        Recurrence::Monthly {
            month_from: year_month(2023, 5),
            month_to: Some(year_month(2022, 10)),
        }
        .validate()
        .expect_err("Invalid range different years");

        Recurrence::Monthly {
            month_from: year_month(2023, 8),
            month_to: Some(year_month(2023, 3)),
        }
        .validate()
        .expect_err("Invalid range same year");
    }
}
