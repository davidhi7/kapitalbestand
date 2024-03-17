# Update one-off transactions by id

Update the one-off transaction with the provided id.

**URL**: `/api/transactions/oneoff/:id`

**Method**: `PATCH`

**Requires Authentication**: yes

**Parameters**:

| Parameter | Accepted values | Required | Description                    |
| --------- | :-------------: | :------: | ------------------------------ |
| `id`      |      `int`      |    x     | Id of the one-off transaction. |

**Attributes**:

| Attribute    | Format             | Required | Description                                  |
| ------------ | ------------------ | :------: | -------------------------------------------- |
| `date`       | `YYYY-MM-DD`       |          | Date on which the transaction occurred.      |
| `amount`     | `int` (cent value) |          | Amount of money of the transaction in cents. |
| `CategoryId` | `int`              |          | Id of the category.                          |
| `ShopId`     | `int`              |          | Id of the shop.                              |

Note that the `isExpense` attribute cannot be modified.

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
        "updatedAt": "2022-12-06T16:50:00.000Z",
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
