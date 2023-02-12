# Update monthly transactions by id

Update the monthly transaction with the provided id.

**URL**: `/api/transactions/monthly/:id`

**Method**: `PATCH`

**Requires Authentication**: yes

**Parameters**:

| Parameter | Accepted values | Required | Description                    |
| --------- | :-------------: | :------: | ------------------------------ |
| `id`      |      `int`      |    x     | Id of the monthly transaction. |

**Attributes**:

| Attribute     | Format             | Required | Description                                                                                                                         |
| ------------- | ------------------ | :------: | ----------------------------------------------------------------------------------------------------------------------------------- |
| `monthFrom`   | `YYYY-MM`          |          | Month in which the monthly transaction first occured.                                                                               |
| `monthTo`     | `YYYY-MM`          |          | Month in which the monthly transaction last occured. If not provided, a monthly transaction without currently known end is assumed. |
| `amount`      | `int` (cent value) |          | Amount of money of the transaction in cents.                                                                                        |
| `category`    | `string`           |          | Name of the category                                                                                                                |
| `CategoryId`  | `int`              |          | ID of the category. If `category` is provided, `CategoryId` will be ignored.                                                        |
| `shop`        | `string`           |          | Name of the shop.                                                                                                                   |
| `ShopId`      | `int`              |          | ID of the shop. If `shop` is provided, `ShopId` will be ignored.                                                                    |
| `description` | `string`           |          | Description of the transaction. Optional.                                                                                           |

Note that the `isExpense` attribute cannot be modified.

## Success response

**Code**: `201 Created`

**Content**:
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "monthFrom": "2022-12-01",
    "monthTo": "2023-01-01",
    "createdAt": "2022-12-06T16:46:51.550Z",
    "updatedAt": "2022-12-06T16:47:00.000Z",
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
Bad request with parameters that failed validation. The response contains a list of these parameters and their values as well as an error message.

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
