# API Contracts

## `POST /api/imports`

Multipart form-data upload.

- field: `file` (`.xlsx`, `.xls`, `.xlsm`)

Response:

```json
{
  "rowsRead": 0,
  "rowsImported": 0,
  "errors": []
}
```

## `GET /api/dashboard/summary`

Query params (all optional):

- `state`
- `city`
- `supervisor`
- `accountName`
- `fromDate` (`YYYY-MM-DD`)
- `toDate` (`YYYY-MM-DD`)

Response:

```json
{
  "totals": {
    "totalCount": 0,
    "openPositionCount": 0,
    "lineUpCount": 0,
    "feedbackAwaited": 0,
    "rejected": 0,
    "selected": 0,
    "shortlisted": 0,
    "backedOut": 0,
    "onHold": 0
  },
  "states": []
}
```

## `GET /api/exports/excel`

- Same filter params as summary endpoint.
- Returns downloadable `.xlsx`.

## `GET /api/exports/pdf`

- Same filter params as summary endpoint.
- Returns downloadable `.pdf`.

## `GET /api/dashboards`

Returns saved dashboard configs and widgets.

## `POST /api/dashboards`

Saves dashboard configuration.
