use serde::Deserialize;

// https://github.com/serde-rs/serde/issues/1042#issuecomment-1656337230
#[derive(Debug, Clone, PartialEq, Eq, Default)]
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

#[cfg(test)]
mod tests {
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
}
