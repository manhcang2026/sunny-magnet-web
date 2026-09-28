# Sunny Magnet Backend V2

Folder này dành cho Backend V2.

**Không đặt business logic mới vào GAS/Google Sheet nếu logic đó thuộc hệ thống V2.**

Tài liệu kiến trúc chính:

[`../docs/SUNNY_BACKEND_V2_ARCHITECTURE.md`](../docs/SUNNY_BACKEND_V2_ARCHITECTURE.md)

## Planned structure

```text
backend/
├── api/
├── db/
├── drive/
├── print-generator/
├── workers/
└── tests/
```

Các folder con sẽ được tạo khi bắt đầu implementation tương ứng; không tạo code placeholder không cần thiết.

## Ownership

- `api/`: server-side order/admin endpoints
- `db/`: backend-side DB helpers/specs
- `drive/`: direct Google Drive API binary storage (local BE-02A foundation; see [module contract](drive/README.md))
- `print-generator/`: A4 PDF + preview generation
- `workers/`: commission, event quota, notifications/background jobs
- `tests/`: backend tests

Supabase migrations khi bắt đầu sử dụng CLI nên nằm tại root `/supabase/migrations/`.

## Drive foundation status

Google Drive is the primary binary storage. Customer-facing operations call Sunny
Backend on Oracle VPS; the backend calls Google Drive API directly. GAS is removed
from the V2 runtime; legacy GAS remains historical/reference only.

The local module provides owner/admin OAuth bootstrap helpers and token refresh,
folder provisioning, and original/artwork/print PDF/preview upload helpers. OAuth
uses the owner's MAIN Google account with `drive.file` scope. The backend will
store the refresh token securely; placeholders are in `.env.example` and must
never use `NEXT_PUBLIC_`. OAuth and Drive integration are not live yet.

The module does not authenticate customers, create orders, calculate pricing,
change payments, generate commissions, manage events, generate print PDFs, or
share files publicly. Supabase asset synchronization and frontend integration
remain future work. Run offline tests with `node --test backend/tests/drive.test.mjs`.
