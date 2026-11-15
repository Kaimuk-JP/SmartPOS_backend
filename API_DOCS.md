# SmartPOS API

เอกสาร endpoint ของ backend (NestJS) เขียนตามโค้ดใน `src/*/*.controller.ts`

เว็บที่เรียกใช้ API นี้: https://pos.bittern-komodo.ts.net/

## พื้นฐาน

- Base URL: `http://localhost:3001/api` (พอร์ตตั้งได้ด้วยตัวแปร `PORT`) ทุก path ขึ้นต้นด้วย `/api`
- ส่งและรับเป็น JSON ฟิลด์ที่ไม่อยู่ใน DTO จะถูกตัดทิ้ง
- ขีดจำกัด 100 คำขอต่อนาที ต่อ IP ถ้าเกินจะได้ `429`
- ถ้าเรียกจากโดเมนอื่น ต้องอยู่ในรายการ CORS (เพิ่มได้ด้วย `CORS_ORIGINS=https://a.com,https://b.com`)
- รูปแบบ error: `{ "statusCode": 400, "message": "..." }`

### การยืนยันตัวตน

หลังล็อกอิน เซิร์ฟเวอร์ตั้ง cookie `access_token` (HttpOnly, อายุ 7 วัน) และส่ง token กลับใน body ด้วย ใช้อย่างใดอย่างหนึ่ง:

- Cookie `access_token` (เบราว์เซอร์ส่งให้เอง ต้องเปิด `credentials: 'include'`)
- Header `Authorization: Bearer <token>`

สัญลักษณ์ในตารางด้านล่าง:

| สัญลักษณ์ | ความหมาย |
| --- | --- |
| เปิด | ไม่ต้องล็อกอิน |
| ถ้ามี token | ไม่บังคับ ถ้าส่ง token มาจะกรองข้อมูลตามร้านของผู้ใช้ ถ้าไม่ส่งต้องระบุ `shopId` เอง |
| ล็อกอิน | ต้องมี token (แอดมินหรือพนักงาน) |
| admin | ต้องเป็น role `admin` |
| admin, staff | ต้องเป็น role `admin` หรือ `staff` |

ข้อมูลแต่ละร้านแยกกันด้วย `shopId` ที่อยู่ใน token

### Pagination

endpoint ที่รองรับใช้ `?limit=20&offset=0` หรือ `?limit=20&page=2` (ใช้ `page` ได้เมื่อมี `limit` และไม่ได้ส่ง `offset`)

---

## Auth `/auth`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| POST | `/auth/login` | เปิด | ล็อกอินพนักงาน/แอดมิน body `{ username, password }` คืน `{ access_token, user, message }` |
| POST | `/auth/logout` | เปิด | ลบ cookie |
| POST | `/auth/register` | เปิด | สมัครร้านใหม่ (ได้ role admin) body `{ username, password, shopName? }` ชื่อซ้ำได้ `409` |
| GET | `/auth/profile` | ล็อกอิน | ข้อมูลผู้ใช้จาก token |

`/auth/register` เปิดสาธารณะ ถ้าไม่อยากให้ใครสมัครได้ ให้ปิดที่ reverse proxy (บนเซิร์ฟเวอร์มือถือปิดไว้แล้วสำหรับคนนอก)

## Products `/products`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/products` | ถ้ามี token | รายการสินค้า query: `search`, `categoryId`, `shopId`, `stockStatus`, `limit`, `offset`, `page` |
| GET | `/products/:id` | เปิด | สินค้าชิ้นเดียว |
| GET | `/products/barcode/:barcode` | ถ้ามี token | หาจากบาร์โค้ด query: `shopId` |
| GET | `/products/stock/transactions` | ล็อกอิน | ประวัติการเคลื่อนไหวสต็อกทั้งร้าน |
| POST | `/products` | admin, staff | เพิ่มสินค้า |
| PUT | `/products/:id` | admin, staff | แก้สินค้า |
| DELETE | `/products/:id` | admin | ลบสินค้า |
| GET | `/products/:id/images` | เปิด | รูปทั้งหมดของสินค้า |
| POST | `/products/:id/images` | admin, staff | เพิ่มรูป body `{ url, isMain? }` |
| PATCH | `/products/:id/images/:imageId/main` | admin, staff | ตั้งเป็นรูปหลัก |
| DELETE | `/products/images/:imageId` | admin, staff | ลบรูป |
| POST | `/products/:id/stock` | admin, staff | เติมสต็อก body `{ qty }` |
| GET | `/products/:id/stock/history` | เปิด | ประวัติสต็อกของสินค้านี้ |

## Categories `/categories`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/categories` | ถ้ามี token | รายการหมวดหมู่ |
| POST | `/categories` | admin, staff | เพิ่ม |
| PUT | `/categories/:id` | admin, staff | แก้ |
| DELETE | `/categories/:id` | admin | ลบ |

## Sales `/sales`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/sales` | ล็อกอิน | ประวัติการขาย query: `status`, `customerId`, `search`, `startDate`, `endDate`, `limit`, `offset` |
| GET | `/sales/today` | ล็อกอิน | ยอดขายวันนี้ |
| GET | `/sales/summary` | ล็อกอิน | สรุปยอด |
| GET | `/sales/dashboard` | ล็อกอิน | ข้อมูลกราฟ query: `viewType`, `year`, `month` |
| GET | `/sales/product-stats` | ล็อกอิน | สถิติสินค้าขายดี query: `dateRange`, `limit`, `offset` |
| GET | `/sales/customer/:customerId` | เปิด | บิลของลูกค้า (หน้าสมาชิกใช้) |
| GET | `/sales/bill/:billNumber` | เปิด | หาบิลจากเลขที่บิล |
| GET | `/sales/:id` | เปิด | บิลเดียว |
| POST | `/sales` | ล็อกอิน | บันทึกการขาย (ตัดสต็อก ให้แต้ม ใช้คูปอง) |
| PUT | `/sales/:id` | admin | แก้บิล |
| DELETE | `/sales/:id` | admin | ลบ/ยกเลิกบิล |

body ของ `POST /sales`:

```json
{
  "customerId": 12,
  "items": [{ "productId": 1, "productName": "น้ำดื่ม", "price": 10, "quantity": 2 }],
  "subtotal": 20,
  "discount": 0,
  "total": 20,
  "paymentMethod": "cash",
  "amountReceived": 50,
  "changeAmount": 30,
  "pointsRedeemed": 0,
  "couponCode": "NEW10",
  "status": "completed",
  "staffId": 3
}
```

บังคับ: `items`, `subtotal`, `discount`, `total`, `paymentMethod` ที่เหลือไม่บังคับ
`paymentMethod` เป็นหนึ่งใน `cash`, `card`, `qr`, `transfer`, `scan`, `promptpay`
`status` เป็น `completed`, `held` หรือ `cancelled`

## Held bills `/held-bills` (พักบิล)

ทุก endpoint ต้องล็อกอิน

| Method | Path | ทำอะไร |
| --- | --- | --- |
| GET | `/held-bills` | บิลที่พักไว้ |
| POST | `/held-bills` | พักบิล body `{ customerId?, items, subtotal, discount, total, notes? }` |
| GET | `/held-bills/:id` | เปิดบิลที่พักมาทำต่อ |
| DELETE | `/held-bills/:id` | ลบ (หลังคิดเงินแล้ว) |

## Cart `/cart`

ตะกร้าที่เก็บฝั่งเซิร์ฟเวอร์ ทุก endpoint ต้องล็อกอิน และรับ `?staffId=` ได้

| Method | Path | ทำอะไร |
| --- | --- | --- |
| GET | `/cart` | อ่านตะกร้า |
| POST | `/cart` | บันทึกตะกร้า body `{ customerId?, items: [{ productId, quantity }] }` |
| DELETE | `/cart` | ล้างตะกร้า |

## Customers `/customers`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/customers` | ล็อกอิน | รายชื่อสมาชิก query: `search`, `shopId`, `limit`, `offset` |
| GET | `/customers/:id` | เปิด | ข้อมูลสมาชิกและแต้ม |
| GET | `/customers/phone/:phone` | เปิด | หาจากเบอร์โทร |
| POST | `/customers/login` | เปิด | สมาชิกล็อกอิน body `{ phone, birthday }` |
| POST | `/customers` | ถ้ามี token | สมัครสมาชิก body `{ name, phone, email?, birthday? }` |
| PUT | `/customers/:id` | ล็อกอิน | แก้ข้อมูล (รวม `points`, `totalSpent`) |
| DELETE | `/customers/:id` | admin | ลบ |

endpoint ที่ "เปิด" ในหมวดนี้คืนข้อมูลส่วนตัวของลูกค้าตาม id หรือเบอร์ ควรจำกัดการเข้าถึงที่ชั้น proxy ถ้าเปิดสู่สาธารณะ

## Coupons `/coupons`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/coupons` | ล็อกอิน | รายการคูปอง query: `search`, `limit`, `offset`, `page` |
| GET | `/coupons/:id` | เปิด | คูปองเดียว |
| GET | `/coupons/code/:code` | ถ้ามี token | หาจากรหัส query: `shopId` |
| POST | `/coupons/validate` | เปิด | ตรวจคูปองก่อนใช้ body `{ code, purchaseAmount }` query: `shopId` |
| POST | `/coupons/use/:code` | ล็อกอิน | ตัดการใช้คูปอง 1 ครั้ง |
| POST | `/coupons` | admin | สร้าง |
| PUT | `/coupons/:id` | admin | แก้ |
| DELETE | `/coupons/:id` | admin | ลบ |

body สร้างคูปอง: `{ code, title, description?, discountType: "percentage" | "fixed", discountValue, minPurchase?, maxUses?, startDate, endDate }` (ตอนแก้เพิ่ม `isActive` ได้)

## Promotions `/promotions`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/promotions` | ถ้ามี token | ทุกโปรโมชั่น |
| GET | `/promotions/active` | ถ้ามี token | เฉพาะที่ใช้งานอยู่ |
| GET | `/promotions/by-product/:productId` | เปิด | โปรโมชั่นของสินค้า |
| GET | `/promotions/:id` | เปิด | โปรโมชั่นเดียว |
| GET | `/promotions/:id/products` | เปิด | สินค้าที่อยู่ในโปรโมชั่น |
| POST | `/promotions` | admin | สร้าง |
| PUT | `/promotions/:id` | admin | แก้ |
| PUT | `/promotions/:id/products` | admin | กำหนดรายการสินค้าในโปรโมชั่น |
| DELETE | `/promotions/:id` | admin | ลบ |

## Rewards `/rewards`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/rewards` | ถ้ามี token | ของรางวัลทั้งหมด |
| GET | `/rewards/active` | ถ้ามี token | เฉพาะที่เปิดให้แลก |
| GET | `/rewards/redemptions/:customerId` | ล็อกอิน | ประวัติการแลกของลูกค้า |
| GET | `/rewards/:id` | เปิด | ของรางวัลเดียว |
| POST | `/rewards/redeem` | ล็อกอิน | แลกรางวัล body `{ customerId, rewardId }` |
| POST | `/rewards` | admin | เพิ่ม body `{ title, description?, pointsRequired, stock, imageUrl? }` |
| PUT | `/rewards/:id` | admin | แก้ (เพิ่ม `isActive` ได้) |
| DELETE | `/rewards/:id` | admin | ลบ |

## News `/news`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/news` | ถ้ามี token | ข่าวทั้งหมด |
| GET | `/news/published` | ถ้ามี token | เฉพาะที่เผยแพร่ (หน้าสมาชิกใช้) |
| GET | `/news/:id` | เปิด | ข่าวเดียว |
| POST | `/news` | admin | เพิ่ม body `{ title, content, imageUrl?, isPublished? }` |
| PUT | `/news/:id` | admin | แก้ ทุกฟิลด์ไม่บังคับ |
| DELETE | `/news/:id` | admin | ลบ |

## Staff `/staff`

ทุก endpoint ต้องเป็น admin จัดการเฉพาะพนักงานในร้านของตัวเอง (ไม่รวมแอดมิน)

| Method | Path | ทำอะไร |
| --- | --- | --- |
| GET | `/staff` | รายชื่อพนักงาน query: `limit`, `offset` |
| POST | `/staff` | เพิ่มพนักงาน (role `staff`) |
| PUT | `/staff/:id` | แก้ข้อมูล |
| DELETE | `/staff/:id` | ลบ |

## Staff logs `/staff-logs`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/staff-logs` | admin | บันทึกการใช้งานของพนักงาน query: `staffId`, `action`, `limit`, `offset` |

## Settings `/settings`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/settings` | ล็อกอิน | ข้อมูลร้าน (ใช้บนใบเสร็จ) |
| PUT | `/settings` | ล็อกอิน | แก้ body (ไม่บังคับทุกฟิลด์) `{ name, address, phone, taxId, logoUrl, promptpayNumber, promptpayName }` |

## Stats `/stats`

| Method | Path | สิทธิ์ | ทำอะไร |
| --- | --- | --- | --- |
| GET | `/stats/dashboard` | admin | ภาพรวมแดชบอร์ด: ยอดขาย กำไร สินค้าขายดี |

## ตรวจสุขภาพ

`GET /` (ไม่มี prefix `/api`) ตอบข้อความสั้นๆ ว่าเซิร์ฟเวอร์ทำงานอยู่

## อัปโหลดรูป

backend ไม่รับไฟล์โดยตรง หน้าเว็บอัปโหลดขึ้น Supabase Storage (bucket `images`, โฟลเดอร์ `products/`, `news/`, `rewards/`) แล้วส่งเฉพาะ URL มาใน `imageUrl` หรือ `POST /products/:id/images`
