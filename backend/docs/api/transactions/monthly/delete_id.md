# Delete monthly transactions by id

Delete the monthly transaction with the corresponding id.

**URL**: `/api/transactions/monthly/:id`

**Method**: `DELETE`

**Requires Authentication**: yes

**Parameters**:

| Parameter | Accepted values | Required | Description                    |
| --------- | :-------------: | :------: | ------------------------------ |
| `id`      |      `int`      |    x     | Id of the monthly transaction. |

## Success response

**Code**: `200 OK`

**Content**:
```json
{
	"status": "success"
}
```

## Error responses
### `404 Not Found`

**Condition**
A transaction with the corresponding id does not exist or the client is not authorised to delete this transaction.

**Content**:
```json
{
	"status": "error",
	"error": "Not Found"
}
```

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
