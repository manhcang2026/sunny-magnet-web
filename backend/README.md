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
├── drive-bridge/
├── print-generator/
├── workers/
└── tests/
```

Các folder con sẽ được tạo khi bắt đầu implementation tương ứng; không tạo code placeholder không cần thiết.

## Ownership

- `api/`: server-side order/admin endpoints
- `db/`: backend-side DB helpers/specs
- `drive-bridge/`: Google Drive / GAS integration
- `print-generator/`: A4 PDF + preview generation
- `workers/`: commission, event quota, notifications/background jobs
- `tests/`: backend tests

Supabase migrations khi bắt đầu sử dụng CLI nên nằm tại root `/supabase/migrations/`.
