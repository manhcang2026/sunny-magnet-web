# Sunny Magnet Repository

Repository chính của Sunny Magnet.

## Cấu trúc hiện tại

Frontend Next.js đang hoạt động ổn định tại **root repository** và tạm thời được giữ nguyên để tránh làm hỏng local/deployment path.

```text
/
├── app/                 # Frontend / Next.js App Router
├── components/          # Frontend components
├── content/             # Frontend canonical content
├── hooks/               # Frontend hooks
├── lib/                 # Frontend/shared helpers
├── public/              # Frontend public assets
│
├── backend/             # Backend V2 — new work goes here
└── docs/                # Architecture and technical decisions
```

## Backend V2

Backend mới sẽ dùng:

- Supabase: database + auth + business state
- Google Drive: file storage chính
- Oracle VPS / server-side runtime: API + workers + print generator
- GAS: Drive bridge tạm thời nếu cần

Chi tiết đầy đủ:

[`docs/SUNNY_BACKEND_V2_ARCHITECTURE.md`](docs/SUNNY_BACKEND_V2_ARCHITECTURE.md)

## Lưu ý về repo refactor

Không move frontend hiện tại vào `apps/web` trong lúc backend đang khởi tạo.

Nếu sau này chuyển sang monorepo chuẩn:

```text
apps/web/
services/api/
services/print-generator/
services/drive-bridge/
supabase/
docs/
```

việc đó phải là một task refactor riêng có checkpoint và test deployment.
