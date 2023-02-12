# Fetch shop names

Fetch all names of shops created by the user.

**URL**: `/api/shops/names`

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
		"first shop",
        "second second shop"
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
