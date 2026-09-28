# Sunny Magnet Backend V2 Architecture & Production System

**Status:** Design Lock / Pre-implementation
**Last updated:** 2026-09-28
**Project:** Sunny Magnet
**Repository:** `manhcang2026/sunny-magnet-web`
**Design branch:** `feat/sunny-motion-01`

---

## 1. Má»¥c Ä‘Ã­ch

TÃ i liá»‡u nÃ y lÃ  tÃ i liá»‡u tham chiáº¿u chÃ­nh cho Backend V2 cá»§a Sunny Magnet.

Backend V2 pháº£i má»Ÿ rá»™ng Ä‘Æ°á»£c cho:

- Ä‘Æ¡n hÃ ng láº»;
- Magnet Studio tá»± chá»‰nh áº£nh;
- Sunny Assist â€” Sunny Magnet chá»‰nh áº£nh giÃºp khÃ¡ch;
- quáº£n lÃ½ thanh toÃ¡n;
- quáº£n lÃ½ sáº£n xuáº¥t;
- tá»± Ä‘á»™ng táº¡o file in A4;
- Google Drive file storage;
- dashboard admin;
- cá»™ng tÃ¡c viÃªn / Ä‘iá»ƒm bÃ¡n / affiliate;
- hoa há»“ng vÃ  payout;
- sá»± kiá»‡n cÃ³ quota;
- bÃ¡o cÃ¡o sá»± kiá»‡n;
- email theo tÃªn miá»n;
- webhook thanh toÃ¡n trong tÆ°Æ¡ng lai.

TÃ i liá»‡u nÃ y khÃ³a **kiáº¿n trÃºc vÃ  business rules cáº¥p há»‡ thá»‘ng** trÆ°á»›c khi code schema/API cá»¥ thá»ƒ.

---

## 2. CÃ¡c nguyÃªn táº¯c Ä‘Ã£ chá»‘t

### 2.1 Guest checkout lÃ  máº·c Ä‘á»‹nh

KhÃ¡ch mua láº» **khÃ´ng báº¯t buá»™c Ä‘Äƒng nháº­p**.

Login báº¯t buá»™c vá»›i:

- Admin;
- Staff;
- Partner / Ä‘iá»ƒm bÃ¡n;
- CTV;
- Affiliate;
- Event organizer náº¿u sau nÃ y má»Ÿ portal riÃªng.

Customer account cÃ³ thá»ƒ bá»• sung sau dÆ°á»›i dáº¡ng optional.

### 2.2 Self-service lÃ  luá»“ng Æ°u tiÃªn

Sunny Magnet Æ°u tiÃªn khÃ¡ch tá»± chá»‰nh áº£nh Ä‘á»ƒ giáº£m workload vÃ  tÄƒng tá»‘c Ä‘á»™ xá»­ lÃ½.

Sunny Assist lÃ  option thá»© cáº¥p, Ã¡p dá»¥ng tá»« **6 nam chÃ¢m trá»Ÿ lÃªn**.

### 2.3 Supabase giá»¯ business data; Google Drive giá»¯ file

**Supabase** lÃ  source of truth cho:

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

**Google Drive** lÃ  file storage chÃ­nh cho:

- áº£nh gá»‘c;
- artwork final;
- PDF in;
- preview.

KhÃ´ng láº¥y Supabase Storage lÃ m kho áº£nh chÃ­nh á»Ÿ giai Ä‘oáº¡n Ä‘áº§u.

### 2.4 GAS khÃ´ng cÃ²n lÃ  business engine

GAS V2 náº¿u cÃ²n dÃ¹ng chá»‰ nÃªn lÃ  **Drive bridge / file service**:

- táº¡o folder Drive;
- upload original;
- upload artwork;
- upload PDF;
- upload preview;
- tráº£ `fileId`, `folderId` vÃ  metadata vá» backend.

KhÃ´ng Ä‘áº·t pricing, promotion, commission, event quota hoáº·c order state trong GAS.

### 2.5 Google Sheet khÃ´ng cÃ²n lÃ  database chÃ­nh

Sheet chá»‰ dÃ¹ng cho:

- export;
- bÃ¡o cÃ¡o;
- Ä‘á»‘i soÃ¡t;
- file gá»­i partner/event organizer khi cáº§n.

Náº¿u Sheet lá»—i thÃ¬ website/order engine váº«n pháº£i hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng.

---

## 3. High-level architecture

```text
                         SUNNYMAGNET.SITE
                               â”‚
            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
            â”‚                                     â”‚
       PUBLIC WEBSITE                        AUTH PORTALS
            â”‚                                     â”‚
    Guest / Customer                 Admin / Staff / Partner
            â”‚                                     â”‚
            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚
                         BACKEND API
                     Oracle VPS / Next.js
                               â”‚
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚                      â”‚                        â”‚
        â–¼                      â–¼                        â–¼
   SUPABASE DB            FILE SERVICE             EMAIL SERVICE
   + Supabase Auth       GAS â†’ Drive initially       domain email
        â”‚                      â”‚
        â”‚                      â–¼
        â”‚                 GOOGLE DRIVE
        â”‚                      â”‚
        â”‚          â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚          â–¼           â–¼           â–¼
        â”‚      ORIGINALS   ARTWORKS     PRINT FILES
        â”‚
        â–¼
     WORKERS
        â”‚
        â”œâ”€â”€ Print Generator
        â”œâ”€â”€ commission calculation
        â”œâ”€â”€ event quota
        â””â”€â”€ notification jobs
```

---

## 4. Order model chung

Sunny Magnet chá»‰ nÃªn cÃ³ **má»™t Order Engine**.

KhÃ´ng táº¡o há»‡ thá»‘ng order riÃªng cho retail, partner vÃ  event.

VÃ­ dá»¥ cÃ¡c field phÃ¢n loáº¡i:

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

CÃ¡c use case sau dÃ¹ng cÃ¹ng core order system:

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

### 5.1 Self Service â€” flow máº·c Ä‘á»‹nh

```text
Upload áº£nh
    â†“
Magnet Studio
    â†“
Crop / preview / adjust
    â†“
Final artworks
    â†“
ThÃ´ng tin giao hÃ ng
    â†“
Create Order
    â†“
VietQR
    â†“
PAYMENT_PENDING
    â†“
Admin xÃ¡c nháº­n thanh toÃ¡n thá»§ cÃ´ng
    â†“
PAID
    â†“
Print Generator
    â†“
READY_TO_PRINT
    â†“
IN_PRODUCTION
    â†“
PACKED
    â†“
DELIVERY / PICKUP
    â†“
COMPLETED
```

### 5.2 Sunny Assist

Business rule:

```text
SUNNY_ASSIST_MIN_QUANTITY = 6
```

Flow:

```text
Upload >= 6 áº£nh gá»‘c
    â†“
KhÃ´ng báº¯t buá»™c má»Ÿ editor
    â†“
Create Order
    â†“
PAYMENT_PENDING
    â†“
PAID
    â†“
NEEDS_ARTWORK
    â†“
Staff chá»‰nh áº£nh
    â†“
ARTWORK_READY
    â†“
Print Generator
    â†“
READY_TO_PRINT
```

Náº¿u dÆ°á»›i 6 áº£nh:

- yÃªu cáº§u thÃªm áº£nh; hoáº·c
- chuyá»ƒn vá» Self Service.

YÃªu cáº§u chá»‰nh sá»­a Ä‘áº·c biá»‡t trao Ä‘á»•i qua Zalo/nhÃ¢n viÃªn há»— trá»£.

---

## 6. Payment rules

### Hiá»‡n táº¡i

Thanh toÃ¡n Ä‘Æ°á»£c xÃ¡c nháº­n **thá»§ cÃ´ng**:

```text
PENDING â†’ admin xÃ¡c nháº­n â†’ PAID
```

### TÆ°Æ¡ng lai

CÃ³ thá»ƒ ná»‘i webhook ngÃ¢n hÃ ng/payment provider. Webhook chá»‰ thay cÃ¡ch chuyá»ƒn `PENDING â†’ PAID`, khÃ´ng thay kiáº¿n trÃºc order.

### COD

**KhÃ´ng COD.** ÄÃ¢y lÃ  sáº£n pháº©m custom.

### Refund

Business rule hiá»‡n táº¡i:

> **KhÃ´ng hoÃ n tiá»n dÆ°á»›i má»i hÃ¬nh thá»©c.**

---

## 7. Shipping rules

### Giao vá» Ä‘á»‹a chá»‰ khÃ¡ch

- khÃ¡ch tráº£ phÃ­ ship;
- phÃ­ ship khÃ´ng tÃ­nh vÃ o partner commission.

### Nháº­n táº¡i Ä‘iá»ƒm bÃ¡n / partner

- Sunny Magnet freeship tá»›i Ä‘iá»ƒm bÃ¡n;
- partner/CTV giao hoáº·c tráº£ trá»±c tiáº¿p cho khÃ¡ch;
- shipping fee Ä‘á»‘i vá»›i khÃ¡ch = 0.

Order form cáº§n hiá»ƒn thá»‹ rÃµ hai lá»±a chá»n nÃ y.

---

## 8. Order state model

KhÃ´ng dÃ¹ng duy nháº¥t má»™t cá»™t `status` cho má»i thá»©.

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
DRAFT â†’ READY
```

Sunny Assist:

```text
NEEDS_ARTWORK â†’ READY
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

`COMPLETED` lÃ  tráº¡ng thÃ¡i trigger commission.

Commission **khÃ´ng phÃ¡t sinh khi PAID**.

```text
Order cÃ³ partner/ref
        â†“
COMPLETED
        â†“
Create commission ledger
```

---

## 10. Core database schema â€” logical design

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

Lá»£i Ã­ch:

- sá»­a riÃªng tá»«ng magnet;
- remake riÃªng má»™t item;
- Ä‘á»‘i chiáº¿u original â†” final;
- regenerate print sheet khÃ´ng áº£nh hÆ°á»Ÿng áº£nh khÃ¡c.

### 10.3 `assets`

Supabase chá»‰ lÆ°u metadata.

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

KhÃ´ng overwrite print file cÅ©.

---

## 11. Google Drive structure

```text
Sunny Magnet/
â””â”€â”€ Orders/
    â””â”€â”€ 2026/
        â””â”€â”€ 09/
            â””â”€â”€ SM-20260928-0001/
                â”‚
                â”œâ”€â”€ 01_ORIGINALS/
                â”‚   â”œâ”€â”€ 001.jpg
                â”‚   â”œâ”€â”€ 002.jpg
                â”‚   â””â”€â”€ ...
                â”‚
                â”œâ”€â”€ 02_ARTWORKS/
                â”‚   â”œâ”€â”€ 001-final.jpg
                â”‚   â”œâ”€â”€ 002-final.jpg
                â”‚   â””â”€â”€ ...
                â”‚
                â””â”€â”€ 03_PRINT/
                    â”œâ”€â”€ page-01-v1.pdf
                    â”œâ”€â”€ page-01-v1-preview.webp
                    â””â”€â”€ ...
```

Sunny Magnet giá»¯ cáº£:

1. áº£nh gá»‘c khÃ¡ch upload;
2. artwork final;
3. PDF in;
4. preview.

Hiá»‡n táº¡i giá»¯ file 100%; viá»‡c backup/xÃ³a do owner xá»­ lÃ½ thá»§ cÃ´ng.

---

## 12. Magnet Studio contract vá»›i backend

Magnet Studio khÃ´ng pháº£i database.

Studio chá»‹u trÃ¡ch nhiá»‡m:

- preview;
- crop/pan/zoom;
- adjustment;
- táº¡o artwork final Ä‘á»‘i vá»›i Self Service.

Backend pháº£i lÆ°u:

- original;
- parameters;
- final artwork;
- mapping original â†” final.

### Mode A â€” Self Service

Luá»“ng Æ°u tiÃªn:

```text
Upload
â†’ auto-valid crop
â†’ khÃ¡ch chá»‰nh náº¿u muá»‘n
â†’ final artwork
```

### Mode B â€” Sunny Assist

Option thá»© cáº¥p:

```text
KhÃ´ng muá»‘n tá»± chá»‰nh?
Sunny chá»‰nh áº£nh giÃºp báº¡n miá»…n phÃ­ cho Ä‘Æ¡n tá»« 6 táº¥m.
```

```text
Upload originals
â†’ no final artwork yet
â†’ NEEDS_ARTWORK
```

---

## 13. Print Generator â€” production spec

### 13.1 Golden sample

`104.pdf` lÃ  file chuáº©n hiá»‡n Ä‘ang Ä‘Æ°á»£c Sunny Magnet mang Ä‘i in.

Print luÃ´n dÃ¹ng:

```text
A4
Actual Size / 100%
```

**KhÃ´ng dÃ¹ng Fit to Page.**

### 13.2 Template

Má»™t trang cÃ³ tá»‘i Ä‘a:

```text
6 magnets
2 columns Ã— 3 rows
```

áº¢nh khÃ¡ch chá»‰ Ä‘Æ°á»£c chÃ¨n vÃ o **vÃ¹ng hÃ¬nh vuÃ´ng trung tÃ¢m**.

Pháº£i giá»¯ nguyÃªn:

- hÃ¬nh dáº¡ng cell;
- flap;
- Ä‘Æ°á»ng cáº¯t;
- text `www.sunnymagnet.site`;
- tá»a Ä‘á»™;
- kÃ­ch thÆ°á»›c váº­t lÃ½.

### 13.3 Fill order

Fill **theo hÃ ng**:

```text
1  2
3  4
5  6
```

VÃ­ dá»¥ 3 áº£nh:

```text
[ 1 ][ 2 ]
[ 3 ][   ]
[   ][   ]
```

VÃ­ dá»¥ 8 áº£nh:

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

Ã” chÆ°a dÃ¹ng pháº£i **100% tráº¯ng**.

KhÃ´ng render:

- border;
- Ä‘Æ°á»ng cáº¯t;
- URL;
- placeholder;
- template cell.

LÃ½ do: pháº§n giáº¥y cÃ²n tráº¯ng Ä‘Æ°á»£c táº­n dá»¥ng Ä‘á»ƒ in láº¡i.

VÃ¬ váº­y Print Generator **khÃ´ng dÃ¹ng nguyÃªn trang template 6 Ã´ lÃ m background**.

Generator pháº£i cÃ³ **master magnet cell** vÃ  chá»‰ render cell vÃ o slot cÃ³ dá»¯ liá»‡u.

### 13.5 Output

Má»—i print job táº¡o:

```text
1 PDF in
+
1 preview image
```

Náº¿u order > 6 thÃ¬ PDF cÃ³ nhiá»u trang.

### 13.6 Acceptance criteria

Print Generator chá»‰ pass khi:

- khá»• A4 Ä‘Ãºng;
- Actual Size 100% Ä‘Ãºng;
- slot Ä‘Ãºng tá»a Ä‘á»™;
- kÃ­ch thÆ°á»›c magnet Ä‘Ãºng;
- vÃ¹ng áº£nh Ä‘Ãºng;
- line/text Ä‘Ãºng;
- slot tráº¯ng hoÃ n toÃ n tráº¯ng.

Prototype pháº£i so trá»±c tiáº¿p vá»›i `104.pdf`.

Sai lá»‡ch váº­t lÃ½ Ä‘Ã¡ng ká»ƒ, Ä‘áº·c biá»‡t gáº§n má»©c 1 mm, chÆ°a Ä‘Æ°á»£c coi lÃ  pass.

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

Referral URL vÃ­ dá»¥:

```text
https://sunnymagnet.site/?ref=doitac042
```

### Attribution rule

> Partner attribution láº¥y theo `ref` Ä‘ang tá»“n táº¡i **táº¡i thá»i Ä‘iá»ƒm khÃ¡ch submit order**.

KhÃ´ng cáº§n attribution window phá»©c táº¡p.

### Commission snapshot

Order pháº£i snapshot:

```text
partner_id
commission_type_snapshot
commission_value_snapshot
```

Náº¿u partner Ä‘á»•i commission sau nÃ y thÃ¬ order cÅ© khÃ´ng thay Ä‘á»•i.

### Commission amount

Commission tÃ­nh trÃªn **giÃ¡ trá»‹ hÃ ng hÃ³a cá»§a order**, khÃ´ng bao gá»“m shipping fee.

### Commission trigger

Chá»‰ khi order `COMPLETED` má»›i táº¡o commission ledger.

---

## 15. Commission ledger

Gá»£i Ã½ báº£ng `commissions`:

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

Cuá»‘i thÃ¡ng:

```text
Partner
â†“
all UNPAID commissions
â†“
Create payout
â†“
Admin transfer
â†“
Mark PAID
```

Dashboard partner cÃ³ thá»ƒ xem:

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
â†“
Apply as affiliate
â†“
PENDING
â†“
Admin approve
â†“
ACTIVE
â†“
Generate ref code
```

Sau nÃ y cÃ³ thá»ƒ auto-approve mÃ  khÃ´ng Ä‘á»•i schema.

---

## 18. Event module

Event lÃ  domain riÃªng vá» business nhÆ°ng dÃ¹ng chung:

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

VÃ­ dá»¥:

```text
200 magnets
3,000,000 VND
```

Organizer tráº£.

### GUEST_PAY

Guest tráº£ nhÆ° retail. Organizer cÃ³ thá»ƒ nháº­n commission theo thá»a thuáº­n.

### HYBRID

VÃ­ dá»¥:

```text
Sponsor quota = 100
```

Tá»« magnet #101 trá»Ÿ Ä‘i:

```text
guest-paid
```

ÄÃ¢y lÃ  use case chÃ­nh thá»©c cáº§n support.

---

## 20. Event guest data

Event váº«n pháº£i thu Ä‘á»§:

```text
name
phone
email
address
```

LÃ½ do:

- organizer cáº§n thá»‘ng kÃª khÃ¡ch;
- khÃ¡ch cÃ³ thá»ƒ order nhiá»u;
- Sunny Magnet cÃ³ thá»ƒ gá»­i hÃ ng vá» nhÃ  sau event.

---

## 21. Event transactions and quota

Má»™t guest/session nÃªn cÃ³ record riÃªng:

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

VÃ­ dá»¥ quota remaining = 2, guest láº¥y 5:

```text
2 sponsor-paid
3 guest-paid
```

Sau Ä‘Ã³ `quota_used = quota`.

---

## 22. Event reports

Organizer cÃ³ thá»ƒ yÃªu cáº§u export:

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

Dashboard há»— trá»£:

```text
Export CSV
Export Excel
```

---

## 23. Admin dashboard

Navigation dá»± kiáº¿n:

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

VÃ­ dá»¥:

```text
SM-20260928-0012

Customer
Nguyá»…n VÄƒn A
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

VÃ­ dá»¥:

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
â†’ Print Generator
â†’ READY_TO_PRINT
```

---

## 26. Email architecture

Há»‡ thá»‘ng má»›i khÃ´ng phá»¥ thuá»™c Gmail cÃ¡ nhÃ¢n cÅ©.

Má»¥c tiÃªu sender:

```text
order@sunnymagnet.site
```

hoáº·c:

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

Marketing email tÃ¡ch riÃªng:

- consent;
- unsubscribe;
- campaign list;
- segmentation.

Provider chÆ°a chá»‘t; Æ°u tiÃªn free tier + custom domain + SPF/DKIM.

---

## 27. Authentication

### KhÃ´ng báº¯t login

- Retail customer;
- Event guest.

### Báº¯t login

- ADMIN;
- STAFF;
- PARTNER;
- AFFILIATE.

Supabase Auth dÃ¹ng cho nhÃ³m authenticated.

---

## 28. Security rules

Public website khÃ´ng Ä‘Æ°á»£c trá»±c tiáº¿p:

- mark payment;
- mark completed;
- Ä‘á»c toÃ n bá»™ orders;
- Ä‘á»c commission;
- Ä‘á»c Drive IDs cá»§a order khÃ¡c;
- update production;
- thay Ä‘á»•i partner rule.

Public chá»‰ gá»i endpoint cÃ³ kiá»ƒm soÃ¡t, vÃ­ dá»¥:

```text
POST /orders
```

Admin/staff endpoint Ä‘Æ°á»£c báº£o vá»‡ báº±ng auth + role.

---

## 29. Legacy GAS â€” known behavior and non-reuse rules

GAS cÅ© Ä‘Ã£ chá»©ng minh Ä‘Æ°á»£c pipeline:

```text
Web
â†’ doPost
â†’ Drive
â†’ Sheet
â†’ order ID
â†’ VietQR
```

NhÆ°ng business rule cÅ© **khÃ´ng Ä‘Æ°á»£c copy nguyÃªn sang V2**.

Äáº·c biá»‡t:

- promotion 13 táº·ng 1 Ä‘Ã£ háº¿t hiá»‡u lá»±c;
- V2 khÃ´ng Ä‘Æ°á»£c dÃ¹ng promotion rule cÅ©;
- price/business rules pháº£i náº±m trong backend/database má»›i;
- Sheet khÃ´ng pháº£i source of truth.

Legacy GAS chá»‰ dÃ¹ng lÃ m reference cho:

- Drive upload;
- naming;
- duplicate protection ideas;
- VietQR format;
- migration/testing.

---

## 30. Supabase project strategy

Dá»± kiáº¿n dÃ¹ng Supabase project sáº¡ch cho Sunny Magnet V2.

Náº¿u account hiá»‡n táº¡i Ä‘Ã£ háº¿t Free project quota:

1. táº¡o account/organization Supabase má»›i;
2. táº¡o project Sunny Magnet V2;
3. cÃ³ thá»ƒ invite account Supabase Ä‘ang káº¿t ná»‘i ChatGPT vá»›i role phÃ¹ há»£p, vÃ­ dá»¥ `Developer`;
4. kiá»ƒm tra connector cÃ³ nhÃ¬n tháº¥y project má»›i trÆ°á»›c khi táº¡o schema.

KhÃ´ng táº¡o production schema trÆ°á»›c khi access Ä‘Æ°á»£c xÃ¡c nháº­n.

---

## 31. Repository strategy

### 31.1 Current state

Frontend Next.js hiá»‡n Ä‘ang á»Ÿ root repo:

```text
/
â”œâ”€â”€ app/
â”œâ”€â”€ components/
â”œâ”€â”€ content/
â”œâ”€â”€ hooks/
â”œâ”€â”€ lib/
â”œâ”€â”€ public/
â”œâ”€â”€ package.json
â”œâ”€â”€ next.config.js
â””â”€â”€ ...
```

KhÃ´ng nÃªn move toÃ n bá»™ frontend ngay trong lÃºc site Ä‘ang cháº¡y á»•n vÃ¬ cÃ³ thá»ƒ áº£nh hÆ°á»Ÿng:

- local commands;
- CloudPanel deployment;
- Next.js config;
- package paths;
- environment variables;
- CI/deployment.

### 31.2 Transitional repo layout â€” Ã¡p dá»¥ng trÆ°á»›c

```text
/
â”œâ”€â”€ app/                       # Existing frontend â€” giá»¯ nguyÃªn táº¡m thá»i
â”œâ”€â”€ components/                # Existing frontend
â”œâ”€â”€ content/                   # Existing frontend
â”œâ”€â”€ hooks/                     # Existing frontend
â”œâ”€â”€ lib/                       # Existing frontend/shared
â”œâ”€â”€ public/                    # Existing frontend assets
â”‚
â”œâ”€â”€ backend/                   # NEW â€” Backend V2
â”‚   â”œâ”€â”€ README.md
â”‚   â”œâ”€â”€ db/
â”‚   â”œâ”€â”€ api/
â”‚   â”œâ”€â”€ print-generator/
â”‚   â”œâ”€â”€ drive-bridge/
â”‚   â”œâ”€â”€ workers/
â”‚   â””â”€â”€ tests/
â”‚
â”œâ”€â”€ docs/
â”‚   â””â”€â”€ SUNNY_BACKEND_V2_ARCHITECTURE.md
â”‚
â”œâ”€â”€ package.json
â””â”€â”€ ...
```

Trong giai Ä‘oáº¡n nÃ y:

```text
ROOT = frontend hiá»‡n táº¡i
/backend = backend V2
/docs = architecture/spec
```

### 31.3 Target monorepo layout â€” chá»‰ lÃ m báº±ng task riÃªng

```text
/
â”œâ”€â”€ apps/
â”‚   â””â”€â”€ web/
â”‚       â”œâ”€â”€ app/
â”‚       â”œâ”€â”€ components/
â”‚       â”œâ”€â”€ content/
â”‚       â”œâ”€â”€ public/
â”‚       â””â”€â”€ ...
â”‚
â”œâ”€â”€ services/
â”‚   â”œâ”€â”€ api/
â”‚   â”œâ”€â”€ print-generator/
â”‚   â”œâ”€â”€ drive-bridge/
â”‚   â””â”€â”€ workers/
â”‚
â”œâ”€â”€ supabase/
â”‚   â”œâ”€â”€ migrations/
â”‚   â”œâ”€â”€ functions/
â”‚   â””â”€â”€ seed/
â”‚
â”œâ”€â”€ docs/
â”œâ”€â”€ scripts/
â””â”€â”€ ...
```

**KhÃ´ng move frontend sang `apps/web` trong cÃ¹ng task vá»›i Backend V2 setup.**

Viá»‡c move frontend pháº£i lÃ  refactor riÃªng, cÃ³ checkpoint vÃ  test deployment.

---

## 32. Backend folder responsibility

```text
backend/
â”œâ”€â”€ db/
â”œâ”€â”€ api/
â”œâ”€â”€ drive-bridge/
â”œâ”€â”€ print-generator/
â”œâ”€â”€ workers/
â””â”€â”€ tests/
```

- `api/`: server-side order/admin endpoints;
- `db/`: backend-side DB helpers/specs;
- `drive-bridge/`: Google Drive/GAS integration;
- `print-generator/`: A4 PDF + preview generation;
- `workers/`: commission, event quota, notifications/background jobs;
- `tests/`: backend tests.

Khi dÃ¹ng Supabase CLI, migrations nÃªn náº±m táº¡i root `/supabase/migrations/`.

---

## 33. Implementation roadmap

### Phase 0 â€” Design Lock

Status: **gáº§n hoÃ n táº¥t**.

Chá»‘t:

- backend architecture;
- order state;
- storage;
- print spec;
- partner;
- event;
- Sunny Assist.

### Phase 1 â€” Backend Core

Táº¡o:

- Supabase project;
- Auth;
- orders;
- order_items;
- assets;
- payment/artwork/production status;
- RLS/security.

ChÆ°a ná»‘i production frontend.

### Phase 2 â€” File Pipeline

- Drive root;
- Drive bridge;
- original upload;
- artwork upload;
- metadata sync.

Test báº±ng order giáº£.

### Phase 3 â€” Print Generator

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

Test Ã­t nháº¥t:

```text
1, 2, 3, 5, 6, 7, 12, 13 items
```

So vá»›i golden sample `104.pdf`.

### Phase 4 â€” Magnet Studio V2

Sá»­a:

- two modes;
- crop constraints;
- preserve originals;
- final artwork;
- save correctness;
- backend contract.

### Phase 5 â€” Order Form V2

```text
Studio
â†’ Backend
â†’ Supabase
â†’ Drive
â†’ VietQR
â†’ email
```

### Phase 6 â€” Admin Dashboard

MVP:

- orders;
- payment confirm;
- artwork status;
- print preview/download;
- production status.

### Phase 7 â€” Partners

- partner account;
- referral;
- commission;
- payout;
- portal.

### Phase 8 â€” Events

- quota;
- guest;
- sponsor package;
- guest-pay overflow;
- report/export.

---

## 34. MVP acceptance test

MVP backend pháº£i pass end-to-end:

```text
Guest
â†“
Upload 7 images
â†“
Self Service Studio
â†“
Originals saved
â†“
Final artworks saved
â†“
Order created in Supabase
â†“
PAYMENT_PENDING
â†“
Admin marks PAID
â†“
Print Generator
â†“
Page 1 = 6 magnets
Page 2 = 1 magnet
5 remaining slots = pure white
â†“
PDF saved to Drive
â†“
Preview saved to Drive
â†“
Admin opens preview/PDF
â†“
Production status can advance
```

Náº¿u pipeline nÃ y cháº¡y á»•n thÃ¬ core architecture Ä‘Æ°á»£c coi lÃ  validated.

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
- Print layout: **A4 / 6 per page / 2Ã—3**
- Print scale: **Actual Size / 100%**
- Fill order: **ROW-MAJOR**
- Unused print slots: **PURE WHITE**
- Print output: **PDF + PREVIEW**
- Golden print sample: **104.pdf**

---

## 36. Deferred decisions

ChÆ°a cáº§n khÃ³a ngay:

- email provider cá»¥ thá»ƒ;
- bank/payment webhook provider;
- exact SQL types/indexes/RLS;
- Drive API trá»±c tiáº¿p hay GAS bridge dÃ i háº¡n;
- optional customer account;
- exact print generator library/runtime;
- exact admin UI;
- retention automation;
- full repo move to `apps/web`;
- event organizer portal;
- affiliate auto-approval.

---

## 37. Next recommended task

### SUNNY-BE-00 â€” Supabase Project & Access Check

Má»¥c tiÃªu:

1. táº¡o Supabase project sáº¡ch;
2. xÃ¡c nháº­n account/organization;
3. xÃ¡c nháº­n ChatGPT connector access;
4. chÆ°a táº¡o production table;
5. sau Ä‘Ã³ má»›i viáº¿t schema migration cho:
   - orders;
   - order_items;
   - assets;
   - print_jobs.

Sau khi Backend Core tá»“n táº¡i má»›i quay láº¡i Magnet Studio V2.

---

## 38. Change discipline

Má»—i milestone backend pháº£i:

- pháº¡m vi háº¹p;
- khÃ´ng mix frontend refactor vá»›i DB migration;
- cÃ³ diff review;
- test Ä‘á»™c láº­p;
- khÃ´ng tá»± Ä‘á»™ng move frontend Ä‘ang cháº¡y;
- khÃ´ng xÃ³a GAS/Sheet cÅ© trÆ°á»›c khi V2 end-to-end pass;
- khÃ´ng migrate dá»¯ liá»‡u cÅ© náº¿u chÆ°a cÃ³ yÃªu cáº§u rÃµ rÃ ng;
- Æ°u tiÃªn rollback dá»….

---

## 39. Summary

Sunny Magnet V2:

```text
Website
   â”‚
   â–¼
Backend API
   â”‚
   â”œâ”€â”€ Supabase = data/auth/business state
   â”œâ”€â”€ Google Drive = originals/artworks/print files
   â”œâ”€â”€ Print Generator = A4 production output
   â”œâ”€â”€ Email provider = transactional email
   â””â”€â”€ GAS = optional transitional Drive bridge
```

Retail, Sunny Assist, Partner vÃ  Event dÃ¹ng chung production core:

```text
ORIGINAL
â†’ ARTWORK
â†’ READY
â†’ PRINT JOB
â†’ PDF
â†’ PRODUCTION
â†’ COMPLETED
```

Business layer khÃ¡c nhau nhÆ°ng production engine chá»‰ cÃ³ **má»™t**.
