# Oneoff Transactions API

All endpoints require authentication via session cookie.

Base path: `/api/transactions/oneoff`

## Create Oneoff Transaction

`POST /api/transactions/oneoff`

### Request Body

All field names use camelCase. Unknown fields are rejected.

| Field        | Type              | Required | Validation                              |
|--------------|-------------------|----------|-----------------------------------------|
| `date`       | string (YYYY-MM-DD) | yes    |                                         |
| `isExpense`  | bool              | yes      |                                         |
| `amount`     | int (cents)       | yes      | >= 1                                    |
| `description`| string            | no       | min 1 grapheme if provided              |
| `categoryId` | int               | yes      | must belong to authenticated user       |
| `shopId`     | int               | no       | must belong to authenticated user       |

### Response

**201 Created**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "date": "2024-01-15",
    "userId": 1,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "isExpense": true,
    "amount": 8542,
    "description": "Weekly grocery shopping",
    "categoryId": 1,
    "category": "Groceries",
    "shopId": 1,
    "shop": "Whole Foods"
  }
}
```

**400 Bad Request** -- invalid/missing `categoryId` or `shopId` (nonexistent or belongs to another user).

---

## List Oneoff Transactions

`GET /api/transactions/oneoff`

### Query Parameters

| Param        | Type              | Required | Default | Description                                  |
|--------------|-------------------|----------|---------|----------------------------------------------|
| `isExpense`  | bool              | no       |         | Filter by expense/income                     |
| `dateFrom`   | string (YYYY-MM-DD) | no     |         | Inclusive lower bound                        |
| `dateTo`     | string (YYYY-MM-DD) | no     |         | Inclusive upper bound                        |
| `amountFrom` | int (cents)       | no       |         | Inclusive lower bound (>= 1)                 |
| `amountTo`   | int (cents)       | no       |         | Inclusive upper bound (>= 1)                 |
| `categoryId` | int               | no       |         | Exact match, must belong to user             |
| `shopId`     | int/null          | no       |         | Exact match or `null` for no shop            |
| `ordering`   | string            | no       | `Asc`   | `Asc` or `Desc`                              |
| `orderKey`   | string            | no       | `Time`  | `Time`, `Amount`, `Category`, or `Shop`      |
| `limit`      | int               | no       | 1000    | Max results (>= 0)                           |
| `offset`     | int               | no       | 0       | Skip N results (>= 0)                        |

**`shopId` tri-state semantics**: omit the field to not filter; set to `null` to match transactions with no shop; set to an ID to match that shop.

Secondary sort is always by `id` in the same direction as `ordering`.

### Response

**200 OK**

```json
{
  "status": "success",
  "data": [ /* array of transaction objects */ ]
}
```

Only returns transactions belonging to the authenticated user.

---

## Get Oneoff Transaction by ID

`GET /api/transactions/oneoff/{id}`

### Response

**200 OK** -- single transaction object (same shape as create response).

**404 Not Found** -- transaction does not exist or belongs to another user.

---

## Update Oneoff Transaction

`PATCH /api/transactions/oneoff/{id}`

All fields are optional. Only provided fields are updated. If no fields are provided, the existing transaction is returned unchanged.

### Request Body

| Field        | Type              | Required | Validation                              |
|--------------|-------------------|----------|-----------------------------------------|
| `date`       | string (YYYY-MM-DD) | no     |                                         |
| `isExpense`  | bool              | no       |                                         |
| `amount`     | int (cents)       | no       | >= 1                                    |
| `description`| string/null       | no       | min 1 grapheme if string; `null` clears |
| `categoryId` | int               | no       | must belong to user                     |
| `shopId`     | int/null          | no       | must belong to user; `null` to clear    |

**`description` and `shopId` tri-state semantics**: omit the field to leave unchanged; set to `null` to clear; set to a value to update.

### Response

**200 OK** -- updated transaction object. `updatedAt` is refreshed.

**404 Not Found** -- transaction does not exist or belongs to another user.

---

## Delete Oneoff Transaction

`DELETE /api/transactions/oneoff/{id}`

### Response

**200 OK**

```json
{
  "status": "success"
}
```

**404 Not Found** -- transaction does not exist or belongs to another user.
