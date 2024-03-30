# Fetch one-off transactions

Fetch one-pff transactions of the user using various optional attributes for filtering.
Fetched transactions are ordered by the `date` value.

**URL**: `/api/transactions/oneoff`

**Method**: `GET`

**Requires Authentication**: yes

**Attributes**:

| Parameter    |  Accepted values   | Required | Description                                                                                                 |
| ------------ | :----------------: | :------: | ----------------------------------------------------------------------------------------------------------- |
| `isExpense`  |     `boolean`      |          | Fetch only transactions that are expenses if `true` is given, otherwise only transactions that are incomes. |
| `dateFrom`   |    `YYYY-MM-DD`    |          | Fetch only transactions that were processed on an earlier or equal date.                                    |
| `dateTo`     |    `YYYY-MM-DD`    |          | Fetch only transactions that were processed on an equal or later date                                       |
| `amountFrom` | `int` (cent value) |          | Fetch only transactions defined by an equal or greater amount of money in Euro cents.                       |
| `amountTo`   | `int` (cent value) |          | Fetch only transactions defined by an lower or equal sum in Euro cents                                      |
| `CategoryId` |       `int`        |          | Fetch only transactions with the given CategoryId                                                           |
| `ShopId`     |       `int`        |          | Fetch only transactions with the given ShopId                                                               |
| `limit`      |       `int`        |          | Fetch only first n transactions. Can be combined with offset.                                               |
| `offset`     |       `int`        |          | Skip first n transactions                                                                                   |

## Success response

**Code**: `200 OK`

**Content**:

```json
{
    "status": "success",
    "data": [
        {
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
        },
        {
            "id": 2,
            "date": "2022-12-13",
            "createdAt": "2022-12-13T22:18:21.150Z",
            "updatedAt": "2022-12-13T22:18:21.150Z",
            "TransactionId": 2,
            "Transaction": {
                "id": 2,
                "description": "this is another sample one-off transaction",
                "amount": 50000,
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
    ]
}
```

## Error responses

### `400 Bad Request`

**Condition**
Bad request with parameters that failed validation. The response contains a list of these parameters and their values.

The following parameters resulted in the provided response:

| Parameter  | Value          |
| ---------- | -------------- |
| `dateFrom` | `not-a-date`   |
| `amountTo` | `not-a-number` |

**Content**:

```json
{
    "status": "error",
    "error": "Bad request on API endpoint GET /api/transactions/oneoff",
    "data": {
        "errors": [
            {
                "value": "not-a-date",
                "msg": "Invalid value",
                "param": "dateFrom",
                "location": "query"
            },
            {
                "value": "not-a-number",
                "msg": "Invalid value",
                "param": "amountTo",
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
