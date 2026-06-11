use garde::{Validate, rules::length::graphemes::Graphemes};
use serde::{Deserialize, Serialize};

// https://github.com/serde-rs/serde/issues/1042#issuecomment-1656337230
#[derive(Debug, Clone, Default, Serialize, PartialEq, Eq)]
pub enum TriState<T> {
    /// key-value pair doesn't exist in the json/query string
    #[default]
    Undefined,
    /// if key-value pair is mapped to None, this is `Option::None`,
    /// otherwise `Option::Some(...)`.
    Defined(Option<T>),
}

impl<'de, T: Deserialize<'de>> Deserialize<'de> for TriState<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        Ok(TriState::Defined(Option::deserialize(deserializer)?))
    }
}

impl<T: Graphemes> Graphemes for TriState<T> {
    fn validate_num_graphemes(&self, min: usize, max: usize) -> Result<(), garde::Error> {
        match self {
            TriState::Defined(Some(val)) => val.validate_num_graphemes(min, max),
            _ => Ok(()),
        }
    }
}

impl<T: Validate> Validate for TriState<T> {
    type Context = T::Context;

    fn validate_into(
        &self,
        ctx: &Self::Context,
        parent: &mut dyn FnMut() -> garde::Path,
        report: &mut garde::Report,
    ) {
        if let TriState::Defined(Some(value)) = self {
            // TODO check path

            value.validate_into(ctx, parent, report);
        }
    }
}

#[cfg(test)]
mod tests {
    use axum::{extract::Query, http::Uri};
    use garde::{Validate, rules::length::graphemes::Graphemes};
    use serde::Deserialize;
    use std::assert_matches;

    use crate::app::api::tri_state_field::TriState;

    #[derive(Deserialize)]
    struct TestStruct<T> {
        #[serde(default)]
        field: TriState<T>,
    }

    #[test]
    fn test_json_undefined() {
        let result: Result<TestStruct<i32>, _> = serde_json::from_str("{}");
        assert!(result.is_ok_and(|v| v.field == TriState::Undefined));
    }

    #[test]
    fn test_json_none() {
        let result: Result<TestStruct<i32>, _> = serde_json::from_str("{\"field\": null}");
        assert!(result.is_ok_and(|v| matches!(v.field, TriState::Defined(None))));
    }

    #[test]
    fn test_json_some() {
        let result: Result<TestStruct<i32>, _> = serde_json::from_str("{\"field\": 314}");
        assert!(result.is_ok_and(|v| matches!(v.field, TriState::Defined(Some(314)))));
    }

    fn parse_query(uri: &str) -> Query<TestStruct<String>> {
        let uri: Uri = uri.parse().expect("Failed to parse URI");
        Query::try_from_uri(&uri).expect("Failed to parse query string")
    }

    #[test]
    fn test_query_undefined() {
        let result = parse_query("http://localhost");
        assert_eq!(result.0.field, TriState::Undefined);
        let result = parse_query("http://localhost?");
        assert_eq!(result.0.field, TriState::Undefined);
        let result = parse_query("http://localhost?other=123");
        assert_eq!(result.0.field, TriState::Undefined);
    }

    #[test]
    fn test_query_defined_none() {}

    #[test]
    fn test_query_defined_some() {
        let result = parse_query("http://localhost?field=");
        assert!(matches!(result.0.field, TriState::Defined(Some(_))));
        let TriState::Defined(Some(value)) = result.0.field else {
            panic!();
        };
        assert_eq!(value, String::new());

        let result = parse_query("http://localhost?field=42");
        assert_matches!(result.0.field, TriState::Defined(Some(_)));
        let TriState::Defined(Some(value)) = result.0.field else {
            panic!();
        };
        assert_eq!(value, "42".to_string());
    }

    #[test]
    fn test_nested() {
        #[derive(Validate)]
        struct Inner(#[garde(range(min = 0, max = 100))] i32);

        #[derive(Validate)]
        struct Test {
            #[garde(dive)]
            data: TriState<Inner>,
        }

        assert!(
            Test {
                data: TriState::Undefined
            }
            .validate()
            .is_ok()
        );

        assert!(
            Test {
                data: TriState::Defined(None)
            }
            .validate()
            .is_ok()
        );

        assert!(
            Test {
                data: TriState::Defined(Some(Inner(50)))
            }
            .validate()
            .is_ok()
        );

        assert!(
            Test {
                data: TriState::Defined(Some(Inner(150)))
            }
            .validate()
            .is_err()
        );
    }

    #[test]
    fn test_validate_length() {
        assert!(
            TriState::Undefined::<String>
                .validate_num_graphemes(1, 10)
                .is_ok()
        );

        assert!(
            TriState::Defined::<String>(None)
                .validate_num_graphemes(1, 10)
                .is_ok(),
        );

        assert!(
            TriState::Defined::<String>(Some("some str".to_string()))
                .validate_num_graphemes(1, 10)
                .is_ok()
        );

        assert!(
            TriState::Defined::<String>(Some("".to_string()))
                .validate_num_graphemes(1, 10)
                .is_err()
        );
    }
}
