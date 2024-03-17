# Fetch one-off transactions by id

Fetch the one-off transaction with the corresponding id.

**URL**: `/api/transactions/oneoff/:id`

**Method**: `GET`

**Requires Authentication**: yes

**Parameters**:

| Parameter | Accepted values | Required | Description                    |
| --------- |:---------------:|:--------:| ------------------------------ |
| `id`      | `int`           | x        | Id of the one-off transaction. |

## Success response

**Code**: `200 OK`

**Content**:

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "date": "2022-12-13",
        "createdAt": "2022-12-13T22:18:03.248Z",
        "updatedAt": "2022-12-13T22:18:03.248Z",
        "TransactionId": 1,
        "Transaction": {
            "id": 1,
            "description": "this is a sample one-off transaction",
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
