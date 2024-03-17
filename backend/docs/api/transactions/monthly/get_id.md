# Fetch monthly transactions by id

Fetch the monthly transaction with the corresponding id.

**URL**: `/api/transactions/monthly/:id`

**Method**: `GET`

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
    "status": "success",
    "data": {
        "id": 1,
        "monthFrom": "2022-01-01",
        "monthTo": "2023-12-01",
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
    }
}
```

## Error responses

### `404 Not Found`

**Condition**
A transaction with the corresponding id does not exist or the client is not authorised to fetch this transaction.

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
