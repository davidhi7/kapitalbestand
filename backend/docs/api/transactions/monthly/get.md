# Fetch monthly transactions

Fetch monthly transactions of the user using various optional attributes for filtering.
Fetched transactions are ordered by the `monthFrom` and `monthTo` value.

**URL**: `/api/transactions/monthly`

**Method**: `GET`

**Requires Authentication**: yes

**Attributes**:

| Attribute    |            Accepted values             | Required | Description                                                                                                                                                                  |
| ------------ | :------------------------------------: | :------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isExpense`  |               `boolean`                |          | Fetch only transactions that are expenses if `true` is given, otherwise only transactions that are incomes.                                                                  |
| `monthFrom`  |               `YYYY-MM`                |          | Fetch only recurrent transactions that didn't stop in a earlier month. Has no effect if `monthTo` equals `'null'`.                                                           |
| `monthTo`    |         `YYYY-MM` or `'null'`          |          | Fetch only recurrent transactions that didn't start in a later month. If `monthTo` is `'null'`, only fetch transactions which don't have a final month.                      |
| `amountFrom` |           `int` (cent value)           |          | Fetch only transactions defined by an equal or greater amount of money in Euro cents. If `amountTo` is also provided, `amountFrom` must be less than or equal to `amountTo`. |
| `amountTo`   |           `int` (cent value)           |          | Fetch only transactions defined by an lower or equal sum in Euro cents                                                                                                       |
| `CategoryId` |                 `int`                  |          | Fetch only transactions with the given `CategoryId`                                                                                                                          |
| `ShopId`     |                 `int`                  |          | Fetch only transactions with the given `ShopId`                                                                                                                              |
| `order`      |            `ASC` or `DESC`             |          | Sort fetched transactions ascending or descending. Defaults to `ASC`.                                                                                                        |
| `orderKey`   | `time`, `amount`, `Category` or `Shop` |          | Sort fetched transactions by the selected key. If set to `time`, order by `monthFrom`, then by `monthTo`. Defaults to `time`.                                                |
| `limit`      |                 `int`                  |          | Fetch only first n transactions. Can be combined with offset.                                                                                                                |
| `offset`     |                 `int`                  |          | Skip first n transactions                                                                                                                                                    |

## Success response

**Code**: `200 OK`

**Content**:

```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "monthFrom": "2022-01",
            "monthTo": "2023-12",
            "createdAt": "2022-12-06T16:56:30.790Z",
            "updatedAt": "2022-12-06T16:56:30.790Z",
            "TransactionId": 1,
            "Transaction": {
                "id": 1,
                "description": "this is a sample monthly transaction",
                "amount": 2000,
                "isExpense": true,
                "CategoryId": 1,
                "ShopId": 1,
                "Category": {
                    "id": 1,
                    "name": "sample category"
                },
                "Shop": {
                    "id": 1,
                    "name": "sample shop"
                }
            }
        },
        {
            "id": 2,
            "monthFrom": "2022-06",
            "monthTo": "2024-10",
            "createdAt": "2022-12-06T16:57:04.794Z",
            "updatedAt": "2022-12-06T16:57:04.794Z",
            "TransactionId": 2,
            "Transaction": {
                "id": 2,
                "description": "this is another monthly transaction",
                "amount": 50000,
                "isExpense": false,
                "CategoryId": 1,
                "ShopId": 1,
                "Category": {
                    "id": 1,
                    "name": "sample category"
                },
                "Shop": {
                    "id": 1,
                    "name": "sample shop"
                }
            }
        }
    ]
}
```

## Error responses

### `400 Bad Request`

**Condition**
Bad request with parameters that failed validation. The response contains a list of these parameters and their values.

The following parameters resulted in the provided response:

| Parameter    | Value           |
| ------------ | --------------- |
| `monthFrom`  | `invalid month` |
| `CategoryId` | `invalid id`    |

**Content**:

```json
{
	"status": "error",
	"error": "Bad request on endpoint GET /api/transactions/monthly/",
	"data": {
		"errors": [
			{
				"type": "field",
				"value": "invalid id",
				"msg": "Invalid value",
				"path": "CategoryId",
				"location": "query"
			},
			{
				"type": "field",
				"value": "invalid month",
				"msg": "Invalid value",
				"path": "monthFrom",
				"location": "query"
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
