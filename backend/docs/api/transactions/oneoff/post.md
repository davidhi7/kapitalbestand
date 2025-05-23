# Create one-off transactions

Create a new one-off transaction for the user.

**URL**: `/api/transactions/oneoff`

**Method**: `POST`

**Requires Authentication**: yes

**Attributes**:

| Attribute     | Format             | Required | Description                                                                                                             |
| ------------- | ------------------ | :------: | ----------------------------------------------------------------------------------------------------------------------- |
| `isExpense`   | `boolean`          |    x     | Whether the type of the transaction is an expense or not. `true` if the money is spent, `false` if the money is earned. |
| `date`        | `YYYY-MM-DD`       |    x     | Date on which the transaction occurred.                                                                                 |
| `amount`      | `int` (cent value) |    x     | Amount of money of the transaction in cents.                                                                            |
| `CategoryId`  | `int`              |    x     | Id of the category.                                                                                                     |
| `ShopId`      | `int`              |          | Id of the shop.                                                                                                         |
| `description` | `string`           |          | Description of the transaction. Optional.                                                                               |

## Success response

**Code**: `201 Created`

**Content**:

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "date": "2022-12-01",
        "createdAt": "2022-12-06T16:49:00.938Z",
        "updatedAt": "2022-12-06T16:49:00.938Z",
        "TransactionId": 1,
        "Transaction": {
            "id": 1,
            "description": "this is a sample one-off income transaction",
            "amount": 100,
            "isExpense": false,
            "CategoryId": 1,
            "ShopId": 1,
            "Category": {
                "id": 1,
                "name": "sample category"
            },
            "Shop": {
                "id": 1,
                "name": "sample transaction"
            }
        }
    }
}
```

## Error responses

### `400 Bad Request`

**Condition**
Bad request with parameters that failed validation or required parameters that are missing. The response contains a list of these parameters and their values.

An empty request without any parameters resulted in the following response:

**Content**:

```json
{
	"status": "error",
	"error": "Bad request on endpoint POST /api/transactions/oneoff/",
	"data": {
		"errors": [
			{
				"type": "field",
				"msg": "Invalid value",
				"path": "isExpense",
				"location": "body"
			},
			{
				"type": "field",
				"msg": "Invalid value",
				"path": "amount",
				"location": "body"
			},
			{
				"type": "field",
				"msg": "Not Found",
				"path": "CategoryId",
				"location": "body"
			},
			{
				"type": "field",
				"msg": "Invalid value",
				"path": "date",
				"location": "body"
			}
		]
	}
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
