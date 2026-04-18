# Categories API

All endpoints require authentication via session cookie.

Base path: `/api/categories`

## Create Category

`POST /api/categories`

### Request Body

| Field  | Type   | Required | Validation       |
|--------|--------|----------|------------------|
| `name` | string | yes      | min 1 grapheme   |

Unknown fields are rejected.

### Response

**201 Created**

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Groceries",
    "user_id": 1,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

**400 Bad Request** -- duplicate name for the same user (unique constraint, `ON CONFLICT DO NOTHING`).

---

## List Categories

`GET /api/categories`

### Query Parameters

| Param    | Type   | Required | Default | Description          |
|----------|--------|----------|---------|----------------------|
| `name`   | string | no       |         | Exact name filter    |
| `limit`  | int    | no       | 1000    | Max results (>= 0)  |
| `offset` | int    | no       | 0       | Skip N results (>= 0) |

### Response

**200 OK**

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "name": "Groceries",
      "user_id": 1,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

Only returns categories belonging to the authenticated user.

---

## Get Category by ID

`GET /api/categories/{id}`

### Response

**200 OK** -- single category object (same shape as create response).

**404 Not Found** -- category does not exist or belongs to another user.

---

## Update Category

`PATCH /api/categories/{id}`

### Request Body

| Field  | Type   | Required | Validation       |
|--------|--------|----------|------------------|
| `name` | string | yes      | min 1 grapheme   |

### Response

**200 OK** -- updated category object. `updated_at` is refreshed; `created_at` is unchanged.

**404 Not Found** -- category does not exist or belongs to another user.

---

## Delete Category

`DELETE /api/categories/{id}`

### Response

**200 OK**

```json
{
  "status": "success"
}
```

**404 Not Found** -- category does not exist or belongs to another user.
