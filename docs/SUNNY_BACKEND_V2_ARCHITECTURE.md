# Sunny Magnet Backend V2 Architecture & Production System

**Status:** Design Lock / Pre-implementation
**Last updated:** 2026-09-28
**Project:** Sunny Magnet
**Repository:** `manhcang2026/sunny-magnet-web`
**Design branch:** `feat/sunny-motion-01`

---

## 1. Mục đích

Tài liệu này là tài liệu tham chiếu chính cho Backend V2 của Sunny Magnet.

Backend V2 phải mở rộng được cho:

- đơn hàng lẻ;
- Magnet Studio tự chỉnh ảnh;
- Sunny Assist — Sunny Magnet chỉnh ảnh giúp khách;
- quản lý thanh toán;
- quản lý sản xuất;
- tự động tạo file in A4;
- Google Drive file storage;
- dashboard admin;
- cộng tác viên / điểm bán / affiliate;
- hoa hồng và payout;
- sự kiện có quota;
- báo cáo sự kiện;
- email theo tên miền;
- webhook thanh toán trong tương lai.

Tài liệu này khóa **kiến trúc và business rules cấp hệ thống** trước khi code schema/API cụ thể.

---

## 2. Các nguyên tắc đã chốt

### 2.1 Guest checkout là mặc định

Khách mua lẻ **không bắt buộc đăng nhập**.

Login bắt buộc với:

- Admin;
- Staff;
- Partner / điểm bán;
- CTV;
- Affiliate;
- Event organizer nếu sau này mở portal riêng.

Customer account có thể bổ sung sau dưới dạng optional.

### 2.2 Self-service là luồng ưu tiên

Sunny Magnet ưu tiên khách tự chỉnh ảnh để giảm workload và tăng tốc độ xử lý.

Sunny Assist là option thứ cấp, áp dụng từ **6 nam châm trở lên**.

### 2.3 Supabase giữ business data; Google Drive giữ file

**Supabase** là source of truth cho:

- order;
- order item;
- payment status;
- artwork status;
- production status;
- customer metadata;
- partner;
- commission;
- event;
- event guest;
- print job metadata;
- auth;
- audit data.

**Google Drive** là file storage chính cho:

- ảnh gốc;
- artwork final;
- PDF in;
- preview.

Không lấy Supabase Storage làm kho ảnh chính ở giai đoạn đầu.

### 2.4 GAS không còn là business engine

GAS V2 nếu còn dùng chỉ nên là **Drive bridge / file service**:

- tạo folder Drive;
- upload original;
- upload artwork;
- upload PDF;
- upload preview;
- trả `fileId`, `folderId` và metadata về backend.

Không đặt pricing, promotion, commission, event quota hoặc order state trong GAS.

### 2.5 Google Sheet không còn là database chính

Sheet chỉ dùng cho:

- export;
- báo cáo;
- đối soát;
- file gửi partner/event organizer khi cần.

Nếu Sheet lỗi thì website/order engine vẫn phải hoạt động bình thường.

---

## 3. High-level architecture

```text
                         SUNNYMAGNET.SITE
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
       PUBLIC WEBSITE                        AUTH PORTALS
            │                                     │
    Guest / Customer                 Admin / Staff / Partner
            │                                     │
            └──────────────────┬──────────────────┘
                               │
                         BACKEND API
                     Oracle VPS / Next.js
                               │
        ┌──────────────────────┼────────────────────────┐
        │                      │                        │
        ▼                      ▼                        ▼
   SUPABASE DB            FILE SERVICE             EMAIL SERVICE
   + Supabase Auth       GAS → Drive initially       domain email
        │                      │
        │                      ▼
        │                 GOOGLE DRIVE
        │                      │
        │          ┌───────────┼───────────┐
        │          ▼           ▼           ▼
        │      ORIGINALS   ARTWORKS     PRINT FILES
        │
        ▼
     WORKERS
        │
        ├── Print Generator
        ├── commission calculation
        ├── event quota
        └── notification jobs
```

---

## 4. Order model chung

Sunny Magnet chỉ nên có **một Order Engine**.

Không tạo hệ thống order riêng cho retail, partner và event.

Ví dụ các field phân loại:

```text
order_channel:
- RETAIL
- EVENT

artwork_mode:
- SELF_SERVICE
- SUNNY_ASSIST

source:
- DIRECT
- PARTNER
- EVENT
- STAFF
```

Các use case sau dùng cùng core order system:

```text
Retail + Self Service
Retail + Sunny Assist
Partner + Self Service
Partner + Sunny Assist
Event + Sponsor
Event + Guest Paid
```

---

## 5. Retail workflow

### 5.1 Self Service — flow mặc định

```text
Upload ảnh
    ↓
Magnet Studio
    ↓
Crop / preview / adjust
    ↓
Final artworks
    ↓
Thông tin giao hàng
    ↓
Create Order
    ↓
VietQR
    ↓
PAYMENT_PENDING
    ↓
Admin xác nhận thanh toán thủ công
    ↓
PAID
    ↓
Print Generator
    ↓
READY_TO_PRINT
    ↓
IN_PRODUCTION
    ↓
PACKED
    ↓
DELIVERY / PICKUP
    ↓
COMPLETED
```

### 5.2 Sunny Assist

Business rule:

```text
SUNNY_ASSIST_MIN_QUANTITY = 6
```

Flow:

```text
Upload >= 6 ảnh gốc
    ↓
Không bắt buộc mở editor
    ↓
Create Order
    ↓
PAYMENT_PENDING
    ↓
PAID
    ↓
NEEDS_ARTWORK
    ↓
Staff chỉnh ảnh
    ↓
ARTWORK_READY
    ↓
Print Generator
    ↓
READY_TO_PRINT
```

Nếu dưới 6 ảnh:

- yêu cầu thêm ảnh; hoặc
- chuyển về Self Service.

Yêu cầu chỉnh sửa đặc biệt trao đổi qua Zalo/nhân viên hỗ trợ.

---

## 6. Payment rules

### Hiện tại

Thanh toán được xác nhận **thủ công**:

```text
PENDING → admin xác nhận → PAID
```

### Tương lai

Có thể nối webhook ngân hàng/payment provider. Webhook chỉ thay cách chuyển `PENDING → PAID`, không thay kiến trúc order.

### COD

**Không COD.** Đây là sản phẩm custom.

### Refund

Business rule hiện tại:

> **Không hoàn tiền dưới mọi hình thức.**

---

## 7. Shipping rules

### Giao về địa chỉ khách

- khách trả phí ship;
- phí ship không tính vào partner commission.

### Nhận tại điểm bán / partner

- Sunny Magnet freeship tới điểm bán;
- partner/CTV giao hoặc trả trực tiếp cho khách;
- shipping fee đối với khách = 0.

Order form cần hiển thị rõ hai lựa chọn này.

---

## 8. Order state model

Không dùng duy nhất một cột `status` cho mọi thứ.

### Payment status

```text
PENDING
PAID
```

### Artwork status

```text
DRAFT
NEEDS_ARTWORK
READY
```

Self Service:

```text
DRAFT → READY
```

Sunny Assist:

```text
NEEDS_ARTWORK → READY
```

### Production status

```text
WAITING
READY_TO_PRINT
IN_PRODUCTION
PACKED
READY_FOR_DELIVERY
COMPLETED
```

### Delivery mode

```text
HOME
PICKUP_PARTNER
EVENT
```

---

## 9. Completion rule

`COMPLETED` là trạng thái trigger commission.

Commission **không phát sinh khi PAID**.

```text
Order có partner/ref
        ↓
COMPLETED
        ↓
Create commission ledger
```

---

## 10. Core database schema — logical design

### 10.1 `orders`

```text
id
order_code
created_at
updated_at

customer_name
phone
email
address

channel
source
artwork_mode

partner_id
event_id

quantity

subtotal
shipping_fee
total_amount

payment_status
artwork_status
production_status
delivery_status

delivery_method
notes

drive_folder_id
completed_at
```

### 10.2 `order_items`

**1 magnet = 1 row.**

```text
id
order_id
position

original_asset_id
artwork_asset_id

crop_x
crop_y
zoom
rotation

brightness
contrast
temperature
tint
filter

artwork_status
created_at
updated_at
```

Lợi ích:

- sửa riêng từng magnet;
- remake riêng một item;
- đối chiếu original ↔ final;
- regenerate print sheet không ảnh hưởng ảnh khác.

### 10.3 `assets`

Supabase chỉ lưu metadata.

```text
id
order_id
order_item_id

type:
- ORIGINAL
- ARTWORK
- PRINT_PDF
- PRINT_PREVIEW

provider:
- GOOGLE_DRIVE

drive_file_id
drive_folder_id
filename
mime_type
size_bytes
version
is_current
created_at
```

### 10.4 `print_jobs`

```text
id
order_id
template_version

status:
- PENDING
- GENERATING
- READY
- FAILED

pages
pdf_asset_id
preview_asset_id

generated_at
generated_by
error_message
```

Không overwrite print file cũ.

---

## 11. Google Drive structure

```text
Sunny Magnet/
└── Orders/
    └── 2026/
        └── 09/
            └── SM-20260928-0001/
                │
                ├── 01_ORIGINALS/
                │   ├── 001.jpg
                │   ├── 002.jpg
                │   └── ...
                │
                ├── 02_ARTWORKS/
                │   ├── 001-final.jpg
                │   ├── 002-final.jpg
                │   └── ...
                │
                └── 03_PRINT/
                    ├── page-01-v1.pdf
                    ├── page-01-v1-preview.webp
                    └── ...
```

Sunny Magnet giữ cả:

1. ảnh gốc khách upload;
2. artwork final;
3. PDF in;
4. preview.

Hiện tại giữ file 100%; việc backup/xóa do owner xử lý thủ công.

---

## 12. Magnet Studio contract với backend

Magnet Studio không phải database.

Studio chịu trách nhiệm:

- preview;
- crop/pan/zoom;
- adjustment;
- tạo artwork final đối với Self Service.

Backend phải lưu:

- original;
- parameters;
- final artwork;
- mapping original ↔ final.

### Mode A — Self Service

Luồng ưu tiên:

```text
Upload
→ auto-valid crop
→ khách chỉnh nếu muốn
→ final artwork
```

### Mode B — Sunny Assist

Option thứ cấp:

```text
Không muốn tự chỉnh?
Sunny chỉnh ảnh giúp bạn miễn phí cho đơn từ 6 tấm.
```

```text
Upload originals
→ no final artwork yet
→ NEEDS_ARTWORK
```

---

## 13. Print Generator — production spec

### 13.1 Golden sample

`104.pdf` là file chuẩn hiện đang được Sunny Magnet mang đi in.

Print luôn dùng:

```text
A4
Actual Size / 100%
```

**Không dùng Fit to Page.**

### 13.2 Template

Một trang có tối đa:

```text
6 magnets
2 columns × 3 rows
```

Ảnh khách chỉ được chèn vào **vùng hình vuông trung tâm**.

Phải giữ nguyên:

- hình dạng cell;
- flap;
- đường cắt;
- text `www.sunnymagnet.site`;
- tọa độ;
- kích thước vật lý.

### 13.3 Fill order

Fill **theo hàng**:

```text
1  2
3  4
5  6
```

Ví dụ 3 ảnh:

```text
[ 1 ][ 2 ]
[ 3 ][   ]
[   ][   ]
```

Ví dụ 8 ảnh:

```text
PAGE 1
[1][2]
[3][4]
[5][6]

PAGE 2
[7][8]
[ ][ ]
[ ][ ]
```

### 13.4 Unused slots

Ô chưa dùng phải **100% trắng**.

Không render:

- border;
- đường cắt;
- URL;
- placeholder;
- template cell.

Lý do: phần giấy còn trắng được tận dụng để in lại.

Vì vậy Print Generator **không dùng nguyên trang template 6 ô làm background**.

Generator phải có **master magnet cell** và chỉ render cell vào slot có dữ liệu.

### 13.5 Output

Mỗi print job tạo:

```text
1 PDF in
+
1 preview image
```

Nếu order > 6 thì PDF có nhiều trang.

### 13.6 Acceptance criteria

Print Generator chỉ pass khi:

- khổ A4 đúng;
- Actual Size 100% đúng;
- slot đúng tọa độ;
- kích thước magnet đúng;
- vùng ảnh đúng;
- line/text đúng;
- slot trắng hoàn toàn trắng.

Prototype phải so trực tiếp với `104.pdf`.

Sai lệch vật lý đáng kể, đặc biệt gần mức 1 mm, chưa được coi là pass.

---

## 14. Partner / CTV / Affiliate

### `partners`

```text
id
user_id
name
code

type:
- POINT_OF_SALE
- COLLABORATOR
- AFFILIATE

commission_type:
- PERCENT
- FIXED

commission_value

status:
- PENDING
- ACTIVE
- SUSPENDED
```

Referral URL ví dụ:

```text
https://sunnymagnet.site/?ref=doitac042
```

### Attribution rule

> Partner attribution lấy theo `ref` đang tồn tại **tại thời điểm khách submit order**.

Không cần attribution window phức tạp.

### Commission snapshot

Order phải snapshot:

```text
partner_id
commission_type_snapshot
commission_value_snapshot
```

Nếu partner đổi commission sau này thì order cũ không thay đổi.

### Commission amount

Commission tính trên **giá trị hàng hóa của order**, không bao gồm shipping fee.

### Commission trigger

Chỉ khi order `COMPLETED` mới tạo commission ledger.

---

## 15. Commission ledger

Gợi ý bảng `commissions`:

```text
id
partner_id
order_id
eligible_amount
rate
amount

status:
- UNPAID
- PAID

earned_at
paid_at
```

---

## 16. Partner payout

Cuối tháng:

```text
Partner
↓
all UNPAID commissions
↓
Create payout
↓
Admin transfer
↓
Mark PAID
```

Dashboard partner có thể xem:

- Referral link;
- Orders;
- Completed orders;
- Eligible revenue;
- Commission;
- Unpaid;
- Paid;
- Payout history.

---

## 17. Affiliate self-registration

```text
Create account
↓
Apply as affiliate
↓
PENDING
↓
Admin approve
↓
ACTIVE
↓
Generate ref code
```

Sau này có thể auto-approve mà không đổi schema.

---

## 18. Event module

Event là domain riêng về business nhưng dùng chung:

- order item;
- asset;
- print generator;
- payment;
- production engine.

### `events`

```text
id
event_code
name

organizer_name
phone
email
address

start_at
end_at
pricing_model
quota
quota_used
commission_rule
status
```

---

## 19. Event pricing models

### SPONSORED_PACKAGE

Ví dụ:

```text
200 magnets
3,000,000 VND
```

Organizer trả.

### GUEST_PAY

Guest trả như retail. Organizer có thể nhận commission theo thỏa thuận.

### HYBRID

Ví dụ:

```text
Sponsor quota = 100
```

Từ magnet #101 trở đi:

```text
guest-paid
```

Đây là use case chính thức cần support.

---

## 20. Event guest data

Event vẫn phải thu đủ:

```text
name
phone
email
address
```

Lý do:

- organizer cần thống kê khách;
- khách có thể order nhiều;
- Sunny Magnet có thể gửi hàng về nhà sau event.

---

## 21. Event transactions and quota

Một guest/session nên có record riêng:

```text
event_transaction
event_id
guest_id
quantity
sponsor_quantity
guest_paid_quantity
amount
payment_status
```

Ví dụ quota remaining = 2, guest lấy 5:

```text
2 sponsor-paid
3 guest-paid
```

Sau đó `quota_used = quota`.

---

## 22. Event reports

Organizer có thể yêu cầu export:

```text
Guest Name
Phone
Email
Address
Quantity
Sponsor-paid quantity
Guest-paid quantity
Amount
Time
```

Dashboard hỗ trợ:

```text
Export CSV
Export Excel
```

---

## 23. Admin dashboard

Navigation dự kiến:

```text
Dashboard
Orders
Production
Events
Partners
Commissions
Customers
Reports
Settings
```

---

## 24. Order detail screen

Ví dụ:

```text
SM-20260928-0012

Customer
Nguyễn Văn A
090...

Order
10 magnets
SELF_SERVICE
Pickup at partner

Payment
PAID

Artwork
10 / 10 READY

Print
1 PDF
[Preview]
[Download PDF]
[Regenerate]

Files
[Originals]
[Artworks]
[Drive Folder]

Partner
doitac042
10%

Production
[Start Production]
```

---

## 25. Sunny Assist admin UX

Ví dụ:

```text
SM-...
12 magnets
SUNNY_ASSIST

Payment       PAID
Artwork       NEEDS_ARTWORK
Print         -
Production    -
```

Action:

```text
[Open originals]
[Mark Artwork Ready]
```

Khi artwork ready:

```text
→ Print Generator
→ READY_TO_PRINT
```

---

## 26. Email architecture

Hệ thống mới không phụ thuộc Gmail cá nhân cũ.

Mục tiêu sender:

```text
order@sunnymagnet.site
```

hoặc:

```text
hello@sunnymagnet.site
```

Transactional email:

```text
ORDER_RECEIVED
PAYMENT_CONFIRMED
IN_PRODUCTION
SHIPPED / READY_FOR_PICKUP
COMPLETED
```

Marketing email tách riêng:

- consent;
- unsubscribe;
- campaign list;
- segmentation.

Provider chưa chốt; ưu tiên free tier + custom domain + SPF/DKIM.

---

## 27. Authentication

### Không bắt login

- Retail customer;
- Event guest.

### Bắt login

- ADMIN;
- STAFF;
- PARTNER;
- AFFILIATE.

Supabase Auth dùng cho nhóm authenticated.

---

## 28. Security rules

Public website không được trực tiếp:

- mark payment;
- mark completed;
- đọc toàn bộ orders;
- đọc commission;
- đọc Drive IDs của order khác;
- update production;
- thay đổi partner rule.

Public chỉ gọi endpoint có kiểm soát, ví dụ:

```text
POST /orders
```

Admin/staff endpoint được bảo vệ bằng auth + role.

---

## 29. Legacy GAS — known behavior and non-reuse rules

GAS cũ đã chứng minh được pipeline:

```text
Web
→ doPost
→ Drive
→ Sheet
→ order ID
→ VietQR
```

Nhưng business rule cũ **không được copy nguyên sang V2**.

Đặc biệt:

- promotion 13 tặng 1 đã hết hiệu lực;
- V2 không được dùng promotion rule cũ;
- price/business rules phải nằm trong backend/database mới;
- Sheet không phải source of truth.

Legacy GAS chỉ dùng làm reference cho:

- Drive upload;
- naming;
- duplicate protection ideas;
- VietQR format;
- migration/testing.

---

## 30. Supabase project strategy

Dự kiến dùng Supabase project sạch cho Sunny Magnet V2.

Nếu account hiện tại đã hết Free project quota:

1. tạo account/organization Supabase mới;
2. tạo project Sunny Magnet V2;
3. invite account Supabase đang kết nối ChatGPT với role `Administrator`: tested behavior shows `Developer` is insufficient for the Supabase OAuth permissions required by the ChatGPT Supabase plugin; `Owner` is not required;
4. kiểm tra connector có nhìn thấy project mới trước khi tạo schema.

Không tạo production schema trước khi access được xác nhận.

---

## 31. Repository strategy

### 31.1 Current state

Frontend Next.js hiện đang ở root repo:

```text
/
├── app/
├── components/
├── content/
├── hooks/
├── lib/
├── public/
├── package.json
├── next.config.js
└── ...
```

Không nên move toàn bộ frontend ngay trong lúc site đang chạy ổn vì có thể ảnh hưởng:

- local commands;
- CloudPanel deployment;
- Next.js config;
- package paths;
- environment variables;
- CI/deployment.

### 31.2 Transitional repo layout — áp dụng trước

```text
/
├── app/                       # Existing frontend — giữ nguyên tạm thời
├── components/                # Existing frontend
├── content/                   # Existing frontend
├── hooks/                     # Existing frontend
├── lib/                       # Existing frontend/shared
├── public/                    # Existing frontend assets
│
├── backend/                   # NEW — Backend V2
│   ├── README.md
│   ├── db/
│   ├── api/
│   ├── print-generator/
│   ├── drive-bridge/
│   ├── workers/
│   └── tests/
│
├── docs/
│   └── SUNNY_BACKEND_V2_ARCHITECTURE.md
│
├── package.json
└── ...
```

Trong giai đoạn này:

```text
ROOT = frontend hiện tại
/backend = backend V2
/docs = architecture/spec
```

### 31.3 Target monorepo layout — chỉ làm bằng task riêng

```text
/
├── apps/
│   └── web/
│       ├── app/
│       ├── components/
│       ├── content/
│       ├── public/
│       └── ...
│
├── services/
│   ├── api/
│   ├── print-generator/
│   ├── drive-bridge/
│   └── workers/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed/
│
├── docs/
├── scripts/
└── ...
```

**Không move frontend sang `apps/web` trong cùng task với Backend V2 setup.**

Việc move frontend phải là refactor riêng, có checkpoint và test deployment.

---

## 32. Backend folder responsibility

```text
backend/
├── db/
├── api/
├── drive-bridge/
├── print-generator/
├── workers/
└── tests/
```

- `api/`: server-side order/admin endpoints;
- `db/`: backend-side DB helpers/specs;
- `drive-bridge/`: Google Drive/GAS integration;
- `print-generator/`: A4 PDF + preview generation;
- `workers/`: commission, event quota, notifications/background jobs;
- `tests/`: backend tests.

Khi dùng Supabase CLI, migrations nên nằm tại root `/supabase/migrations/`.

---

## 33. Implementation roadmap

### Phase 0 — Design Lock

Status: **gần hoàn tất**.

Chốt:

- backend architecture;
- order state;
- storage;
- print spec;
- partner;
- event;
- Sunny Assist.

### Phase 1 — Backend Core

Status update (2026-09-28):

- Supabase project `sunny-magnet-v2` is initialized (project ref `xlngzsqtoiwmirxficij`, region `ap-southeast-1`).
- Backend Core foundation is initialized with the `orders`, `order_items`, `assets`, and `print_jobs` tables.
- All four tables have RLS enabled. Browser roles `anon` and `authenticated` currently have no direct table access.
- There are intentionally no RLS policies yet; public order creation will later use controlled backend endpoints.
- Google Drive/File Pipeline, Print Generator, and Partner/Event modules are not implemented yet.
- Git now mirrors remote migrations `20260928075743_foundation_security`, `20260928075919_core_order_schema`, and `20260928075939_print_job_asset_indexes`.
- Asset relationships intentionally use `assets.order_item_id`; the current item asset is resolved by `order_item_id`, `asset_type`, and `is_current = true` (no circular asset foreign keys on `order_items`).

Tạo:

- Supabase project;
- Auth;
- orders;
- order_items;
- assets;
- payment/artwork/production status;
- RLS/security.

Chưa nối production frontend.

### Phase 2 — File Pipeline

- Drive root;
- Drive bridge;
- original upload;
- artwork upload;
- metadata sync.

Test bằng order giả.

### Phase 3 — Print Generator

Input:

```text
N final artworks
```

Output:

```text
A4 PDF
+
preview
```

Test ít nhất:

```text
1, 2, 3, 5, 6, 7, 12, 13 items
```

So với golden sample `104.pdf`.

### Phase 4 — Magnet Studio V2

Sửa:

- two modes;
- crop constraints;
- preserve originals;
- final artwork;
- save correctness;
- backend contract.

### Phase 5 — Order Form V2

```text
Studio
→ Backend
→ Supabase
→ Drive
→ VietQR
→ email
```

### Phase 6 — Admin Dashboard

MVP:

- orders;
- payment confirm;
- artwork status;
- print preview/download;
- production status.

### Phase 7 — Partners

- partner account;
- referral;
- commission;
- payout;
- portal.

### Phase 8 — Events

- quota;
- guest;
- sponsor package;
- guest-pay overflow;
- report/export.

---

## 34. MVP acceptance test

MVP backend phải pass end-to-end:

```text
Guest
↓
Upload 7 images
↓
Self Service Studio
↓
Originals saved
↓
Final artworks saved
↓
Order created in Supabase
↓
PAYMENT_PENDING
↓
Admin marks PAID
↓
Print Generator
↓
Page 1 = 6 magnets
Page 2 = 1 magnet
5 remaining slots = pure white
↓
PDF saved to Drive
↓
Preview saved to Drive
↓
Admin opens preview/PDF
↓
Production status can advance
```

Nếu pipeline này chạy ổn thì core architecture được coi là validated.

---

## 35. Decisions locked as of 2026-09-28

- Guest checkout: **YES**
- Customer login required: **NO**
- Admin/Partner login: **YES**
- Payment confirm now: **MANUAL**
- Payment webhook later: **YES**
- COD: **NO**
- Refund: **NO**
- Sunny Assist threshold: **>= 6**
- Self Service priority: **YES**
- Preserve originals: **YES**
- Preserve final artwork: **YES**
- Preserve print PDF: **YES**
- Preserve preview: **YES**
- File storage primary: **GOOGLE DRIVE**
- Supabase Storage primary: **NO**
- Business DB: **SUPABASE**
- Partner commission trigger: **ORDER COMPLETED**
- Partner commission excludes shipping: **YES**
- Ref attribution: **REF AT ORDER SUBMISSION**
- Event guest full contact info: **YES**
- Event quota: **YES**
- Hybrid sponsor + guest-paid overflow: **YES**
- Print layout: **A4 / 6 per page / 2×3**
- Print scale: **Actual Size / 100%**
- Fill order: **ROW-MAJOR**
- Unused print slots: **PURE WHITE**
- Print output: **PDF + PREVIEW**
- Golden print sample: **104.pdf**

---

## 36. Deferred decisions

Chưa cần khóa ngay:

- email provider cụ thể;
- bank/payment webhook provider;
- exact SQL types/indexes/RLS;
- Drive API trực tiếp hay GAS bridge dài hạn;
- optional customer account;
- exact print generator library/runtime;
- exact admin UI;
- retention automation;
- full repo move to `apps/web`;
- event organizer portal;
- affiliate auto-approval.

---

## 37. Next recommended task

Completed foundation work:

- SUNNY-BE-00 — Supabase Project & Access Check.
- SUNNY-BE-01 / BE-01R — Backend Core initialization and remote migration mirroring.

### SUNNY-BE-02 — Google Drive / File Pipeline

Scope:

- create Drive root/folder convention;
- define Drive bridge contract;
- upload originals;
- upload final artworks;
- sync Drive metadata to Supabase assets;
- no Print Generator yet;
- no frontend integration yet.

---

## 38. Change discipline

Mỗi milestone backend phải:

- phạm vi hẹp;
- không mix frontend refactor với DB migration;
- có diff review;
- test độc lập;
- không tự động move frontend đang chạy;
- không xóa GAS/Sheet cũ trước khi V2 end-to-end pass;
- không migrate dữ liệu cũ nếu chưa có yêu cầu rõ ràng;
- ưu tiên rollback dễ.

---

## 39. Summary

Sunny Magnet V2:

```text
Website
   │
   ▼
Backend API
   │
   ├── Supabase = data/auth/business state
   ├── Google Drive = originals/artworks/print files
   ├── Print Generator = A4 production output
   ├── Email provider = transactional email
   └── GAS = optional transitional Drive bridge
```

Retail, Sunny Assist, Partner và Event dùng chung production core:

```text
ORIGINAL
→ ARTWORK
→ READY
→ PRINT JOB
→ PDF
→ PRODUCTION
→ COMPLETED
```

Business layer khác nhau nhưng production engine chỉ có **một**.
