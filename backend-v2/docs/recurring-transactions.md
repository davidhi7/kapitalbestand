# Recurring Transactions API

All endpoints require authentication via session cookie.

Base path: `/api/transactions/recurring`

## Recurrence Object

Recurrence is a tagged union on the `frequency` field. Two variants:

**Monthly**

```json
{
  "frequency": "monthly",
  "monthFrom": "2024-01",
  "monthTo": "2024-12"
}
```

- `monthFrom` (string, required): `YYYY-MM` format, month 1-12.
- `monthTo` (string, optional): `YYYY-MM` format, must be >= `monthFrom`. Omit or `null` for non-terminating.

**Yearly**

```json
{
  "frequency": "yearly",
  "yearFrom": 2024,
  "yearTo": 2025
}
```

- `yearFrom` (int, required): start year.
- `yearTo` (int, optional): must be >= `yearFrom`. Omit or `null` for non-terminating.

---

## Create Recurring Transaction

`POST /api/transactions/recurring`

### Request Body

All field names use camelCase. Unknown fields are rejected.

| Field        | Type        | Required | Validation                              |
|--------------|-------------|----------|-----------------------------------------|
| `recurrence` | object      | yes      | See Recurrence Object above             |
| `isExpense`  | bool        | yes      |                                         |
| `amount`     | int (cents) | yes      | >= 1                                    |
| `description`| string      | no       | min 1 grapheme if provided              |
| `categoryId` | int         | yes      | must belong to authenticated user       |
| `shopId`     | int         | no       | must belong to authenticated user       |

### Response

**201 Created**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "recurrence": {
      "frequency": "monthly",
      "monthFrom": "2024-01",
      "monthTo": "2024-12"
    },
    "userId": 1,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "isExpense": true,
    "amount": 1599,
    "description": "Netflix subscription",
    "categoryId": 4,
    "category": "Entertainment",
    "shopId": 6,
    "shop": "Netflix"
  }
}
```

**400 Bad Request** -- invalid/missing `categoryId` or `shopId` (nonexistent or belongs to another user).

---

## List Recurring Transactions

`GET /api/transactions/recurring`

### Query Parameters

| Param             | Type            | Required | Default | Description                                        |
|-------------------|-----------------|----------|---------|----------------------------------------------------|
| `frequency`       | string          | no       |         | `monthly` or `yearly`                              |
| `intervalStartsLe`| string (YYYY-MM)| no       |         | Only transactions starting <= this month           |
| `intervalEndsGe`  | string (YYYY-MM)| no       |         | Only transactions ending >= this month (includes non-terminating) |
| `isTerminating`   | bool            | no       |         | `true` = has end date; `false` = no end date       |
| `isExpense`       | bool            | no       |         | Filter by expense/income                           |
| `amountFrom`      | int (cents)     | no       |         | Inclusive lower bound (>= 1)                       |
| `amountTo`        | int (cents)     | no       |         | Inclusive upper bound (>= 1)                       |
| `categoryId`      | int             | no       |         | Exact match, must belong to user                   |
| `shopId`          | int/null        | no       |         | Exact match or `null` for no shop                  |
| `ordering`        | string          | no       | `Asc`   | `Asc` or `Desc`                                    |
| `orderKey`        | string          | no       | `Time`  | `Time`, `Amount`, `Category`, or `Shop`            |
| `limit`           | int             | no       | 1000    | Max results (>= 0)                                 |
| `offset`          | int             | no       | 0       | Skip N results (>= 0)                              |

**`shopId` tri-state semantics**: omit to not filter; set to `null` to match transactions with no shop; set to an ID to match that shop.

When `orderKey` is `Time`, sorting is by `interval_from` then `interval_to`.

Secondary sort is always by `id` in the same direction as `ordering`.

### Response

**200 OK**

```json
{
  "status": "success",
  "data": [ /* array of recurring transaction objects */ ]
}
```

Only returns transactions belonging to the authenticated user.

---

## Get Recurring Transaction by ID

`GET /api/transactions/recurring/{id}`

### Response

**200 OK** -- single recurring transaction object (same shape as create response).

**404 Not Found** -- transaction does not exist or belongs to another user.

---

## Update Recurring Transaction

`PATCH /api/transactions/recurring/{id}`

All fields are optional. Only provided fields are updated. If no fields are provided, the existing transaction is returned unchanged.

### Request Body

| Field        | Type        | Required | Validation                              |
|--------------|-------------|----------|-----------------------------------------|
| `recurrence` | object      | no       | See Recurrence Object above             |
| `isExpense`  | bool        | no       |                                         |
| `amount`     | int (cents) | no       | >= 1                                    |
| `description`| string/null | no       | min 1 grapheme if string; `null` clears |
| `categoryId` | int         | no       | must belong to user                     |
| `shopId`     | int/null    | no       | must belong to user; `null` to clear    |

**`description` and `shopId` tri-state semantics**: omit the field to leave unchanged; set to `null` to clear; set to a value to update.

### Response

**200 OK** -- updated recurring transaction object. `updatedAt` is refreshed.

**404 Not Found** -- transaction does not exist or belongs to another user.

---

## Delete Recurring Transaction

`DELETE /api/transactions/recurring/{id}`

### Response

**200 OK**

```json
{
  "status": "success"
}
```

**404 Not Found** -- transaction does not exist or belongs to another user.
