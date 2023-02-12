# Fetch category names

Fetch all names of categories created by the user.

**URL**: `/api/categories/names`

**Method**: `GET`

**Requires Authentication**: yes

**Attributes**: none

## Success response

**Code**: `200 OK`

**Content**:
```json
{
	"status": "success",
	"data": [
		"first category",
        "second category"
	]
}
```

## Error responses
### `401 Unauthorized`

**Condition**
The client is not authenticated.

**Content**:
```json
{
	"status": "error",
	"error": "Unauthorized"
}
```
