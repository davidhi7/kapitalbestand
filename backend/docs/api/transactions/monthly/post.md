# Create monthly transactions

Create a new monthly transaction for the user.

**URL**: `/api/transactions/monthly`

**Method**: `POST`

**Requires Authentication**: yes

**Attributes**:

| Attribute     | Format             | Required | Description                                                                                                                                                                 |
| ------------- | ------------------ | :------: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isExpense`   | `boolean`          |    x     | Whether the type of the transaction is an expense or not. `true` if the money is spent, `false` if the money is earned.                                                     |
| `monthFrom`   | `YYYY-MM`          |    x     | Month in which the monthly transaction first occured.                                                                                                                       |
| `monthTo`     | `YYYY-MM`          |          | Month in which the monthly transaction last occured. If not provided, a monthly transaction without currently known end is assumed. Must be greater or equal to `monthFrom` |
| `amount`      | `int` (cent value) |    x     | Amount of money of the transaction in cents.                                                                                                                                |
| `CategoryId`  | `int`              |    x     | Id of the category.                                                                                                                                                         |
| `ShopId`      | `int`              |          | Id of the shop.                                                                                                                                                             |
| `description` | `string`           |          | Description of the transaction. Optional.                                                                                                                                   |

## Success response

**Code**: `201 Created`

**Content**:

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "monthFrom": "2022-12",
        "monthTo": "2023-01",
        "createdAt": "2022-12-06T16:46:51.550Z",
        "updatedAt": "2022-12-06T16:46:51.550Z",
        "TransactionId": 1,
        "Transaction": {
            "id": 1,
            "description": "this is a sample monthly transaction",
            "amount": 100,
            "isExpense": true,
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
Bad request with parameters that failed validation or required parameters that are missing. The response contains a list of these parameters and their values as well as an error message.

An empty request without any parameters resulted in the following response:

**Content**:

```json
{
	"status": "error",
	"error": "Bad request on endpoint POST /api/transactions/monthly/",
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
				"path": "monthFrom",
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
