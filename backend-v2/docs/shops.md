# Shops API

All endpoints require authentication via session cookie.

Base path: `/api/shops`

## Create Shop

`POST /api/shops`

### Request Body

| Field  | Type   | Required | Validation     |
| ------ | ------ | -------- | -------------- |
| `name` | string | yes      | min 1 grapheme |

Unknown fields are rejected.

### Response

**201 Created**

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "name": "Whole Foods",
        "user_id": 1,
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-01T00:00:00Z"
    }
}
```

**400 Bad Request** -- duplicate name for the same user (unique constraint, `ON CONFLICT DO NOTHING`).

---

## List Shops

`GET /api/shops`

### Query Parameters

| Param    | Type   | Required | Default | Description           |
| -------- | ------ | -------- | ------- | --------------------- |
| `name`   | string | no       |         | Exact name filter     |
| `limit`  | int    | no       | 1000    | Max results (>= 0)    |
| `offset` | int    | no       | 0       | Skip N results (>= 0) |

### Response

**200 OK**

```json
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "name": "Whole Foods",
            "user_id": 1,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        }
    ]
}
```

Only returns shops belonging to the authenticated user.

---

## List Shops with Transaction Counts

`GET /api/shops/counts`

Like `List Shops`, but each shop is annotated with the number of oneoff and recurring transactions referencing it via its foreign key.

### Query Parameters

| Param    | Type | Required | Default | Description           |
| -------- | ---- | -------- | ------- | --------------------- |
| `limit`  | int  | no       | 1000    | Max results (>= 0)    |
| `offset` | int  | no       | 0       | Skip N results (>= 0) |

There is no `name` filter on this endpoint.

### Response

**200 OK**

```json
{
    "status": "success",
    "data": [
        {
            "shop": {
                "id": 1,
                "name": "Whole Foods",
                "user_id": 1,
                "created_at": "2026-01-01T00:00:00Z",
                "updated_at": "2026-01-01T00:00:00Z"
            },
            "counts": {
                "oneoff": 3,
                "recurring": 1
            }
        }
    ]
}
```

---

## Get Shop by ID

`GET /api/shops/{id}`

### Response

**200 OK** -- single shop object (same shape as create response).

**404 Not Found** -- shop does not exist or belongs to another user.

---

## Update Shop

`PATCH /api/shops/{id}`

### Request Body

| Field  | Type   | Required | Validation     |
| ------ | ------ | -------- | -------------- |
| `name` | string | yes      | min 1 grapheme |

### Response

**200 OK** -- updated shop object. `updated_at` is refreshed; `created_at` is unchanged.

**404 Not Found** -- shop does not exist or belongs to another user.

---

## Delete Shop

`DELETE /api/shops/{id}`

### Response

**200 OK**

```json
{
    "status": "success"
}
```

**404 Not Found** -- shop does not exist or belongs to another user.

**409 Conflict** -- the shop is still referenced by one or more oneoff or recurring transactions. The shop is not deleted.
