use garde::{Validate, rules::length::graphemes::Graphemes};
use serde::{Deserialize, Serialize};

// https://github.com/serde-rs/serde/issues/1042#issuecomment-1656337230
#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
pub enum JsonField<T> {
    /// key-value pair doesn't exist in the json source
    #[default]
    Undefined,
    /// if key-value pair is mapped to None, this is `Option::None`,
    /// otherwise `Option::Some(...)`
    Defined(Option<T>),
}

impl<'de, T: Deserialize<'de>> Deserialize<'de> for JsonField<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Ok(JsonField::Defined(Option::deserialize(deserializer)?))
    }
}

impl<T: Graphemes> Graphemes for JsonField<T> {
    fn validate_num_graphemes(&self, min: usize, max: usize) -> Result<(), garde::Error> {
        match self {
            JsonField::Defined(Some(val)) => val.validate_num_graphemes(min, max),
            _ => Ok(()),
        }
    }
}

impl<T: Validate> Validate for JsonField<T> {
    type Context = T::Context;

    fn validate_into(
        &self,
        ctx: &Self::Context,
        parent: &mut dyn FnMut() -> garde::Path,
        report: &mut garde::Report,
    ) {
        if let JsonField::Defined(Some(value)) = self {
            // TODO check path

            value.validate_into(ctx, parent, report);
        }
    }
}

#[cfg(test)]
mod tests {
    use garde::{Validate, rules::length::graphemes::Graphemes};
    use serde::Deserialize;

    use crate::app::api::json_field::JsonField;

    #[derive(Deserialize)]
    struct TestStruct {
        #[serde(default)]
        field: JsonField<i32>,
    }

    #[test]
    fn test_undefined() {
        let result: Result<TestStruct, _> = serde_json::from_str("{}");
        assert!(result.is_ok_and(|v| v.field == JsonField::Undefined));
    }

    #[test]
    fn test_none() {
        let result: Result<TestStruct, _> = serde_json::from_str("{\"field\": null}");
        assert!(result.is_ok_and(|v| matches!(v.field, JsonField::Defined(None))));
    }

    #[test]
    fn test_some() {
        let result: Result<TestStruct, _> = serde_json::from_str("{\"field\": 314}");
        assert!(result.is_ok_and(|v| matches!(v.field, JsonField::Defined(Some(314)))));
    }

    #[test]
    fn test_nested() {
        #[derive(Validate)]
        struct Inner(#[garde(range(min = 0, max = 100))] i32);

        #[derive(Validate)]
        struct Test {
            #[garde(dive)]
            data: JsonField<Inner>,
        }

        assert!(
            Test {
                data: JsonField::Undefined
            }
            .validate()
            .is_ok()
        );

        assert!(
            Test {
                data: JsonField::Defined(None)
            }
            .validate()
            .is_ok()
        );

        assert!(
            Test {
                data: JsonField::Defined(Some(Inner(50)))
            }
            .validate()
            .is_ok()
        );

        assert!(
            Test {
                data: JsonField::Defined(Some(Inner(150)))
            }
            .validate()
            .is_err()
        );
    }

    #[test]
    fn test_validate_length() {
        assert!(
            JsonField::Undefined::<String>
                .validate_num_graphemes(1, 10)
                .is_ok()
        );

        assert!(
            JsonField::Defined::<String>(None)
                .validate_num_graphemes(1, 10)
                .is_ok(),
        );

        assert!(
            JsonField::Defined::<String>(Some("some str".to_string()))
                .validate_num_graphemes(1, 10)
                .is_ok()
        );

        assert!(
            JsonField::Defined::<String>(Some("".to_string()))
                .validate_num_graphemes(1, 10)
                .is_err()
        );
    }
}
