# SmartPOS Backend

API ของระบบขายหน้าร้าน SmartPOS ทำด้วย NestJS เก็บข้อมูลใน **PostgreSQL** และล็อกอินด้วย JWT

โค้ดคุยกับฐานข้อมูลผ่าน `supabase-js` ซึ่งเรียก REST API แบบ PostgREST จึงใช้ได้ทั้ง PostgreSQL ที่ติดตั้งเอง (บนมือถือใช้แบบนี้: PostgreSQL + PostgREST) และ Supabase ที่เป็น PostgreSQL เหมือนกัน
หน้าเว็บอยู่อีก repo: [SmartPOS_frontend](https://github.com/Kaimuk-JP/SmartPOS_frontend)

## ลองใช้งาน

เว็บ: https://pos.bittern-komodo.ts.net/

## ทำอะไรได้บ้าง

- ล็อกอินพนักงานและสมาชิก ออก token เก็บเป็น HttpOnly cookie (รับแบบ `Authorization: Bearer` ได้ด้วย)
- โมดูลธุรกิจ: สินค้า หมวดหมู่ ตะกร้า การขาย พักบิล ลูกค้า คูปอง โปรโมชั่น ของรางวัล ข่าว พนักงาน บันทึกการใช้งานพนักงาน สถิติ และการตั้งค่าร้าน
- ตรวจข้อมูลที่ส่งเข้ามาด้วย DTO กับ ValidationPipe
- จำกัดจำนวนคำขอด้วย Throttler
- ตั้ง CORS ให้หน้าเว็บเรียกข้ามโดเมนได้ (โดเมนเพิ่มเองได้ด้วย `CORS_ORIGINS`)

รายการ endpoint ทั้งหมดอยู่ใน [API_DOCS.md](API_DOCS.md) ทุก path ขึ้นต้นด้วย `/api`

## เครื่องมือที่ใช้

NestJS 11, TypeScript, Supabase JS, @nestjs/jwt, Passport, @nestjs/throttler, Jest

## รันในเครื่อง

ต้องมี Node 20 ขึ้นไป และ Docker (ใช้รันฐานข้อมูลอย่างเดียว ตัว API รันด้วย Node ปกติ)

```bash
# 1. สร้างกุญแจสุ่มและไฟล์ .env (ของ backend และของชุดฐานข้อมูล)
node local/make-env.js

# 2. เปิดฐานข้อมูล PostgreSQL + PostgREST (ครั้งแรกจะสร้างตารางและข้อมูลตัวอย่างให้เอง)
docker compose --env-file local/.env -f local/docker-compose.yml up -d

# 3. รัน API
npm install
npm run start:dev
```

API ทำงานที่ http://localhost:3001/api เข้าสู่ระบบทดลองด้วย `smartpos` / `123456789`

ขั้นที่ 1 พิมพ์ค่า 3 บรรทัดสำหรับหน้าเว็บออกมาด้วย ให้ก๊อปไปใส่ไฟล์ `.env.local` ของ [SmartPOS_frontend](https://github.com/Kaimuk-JP/SmartPOS_frontend) แล้วรัน `npm run dev` ที่นั่น เปิด http://localhost:3000

พอร์ตที่ใช้: ฐานข้อมูล 5432 (ฟังเฉพาะเครื่องนี้), PostgREST ผ่าน nginx 8000, API 3001 ถ้าพอร์ตชน ตั้ง `GATEWAY_PORT` หรือ `DB_PORT` ก่อนรันขั้นที่ 1 และ 2

เริ่มฐานข้อมูลใหม่ทั้งหมด: `docker compose --env-file local/.env -f local/docker-compose.yml down -v` แล้วทำขั้นที่ 2 ซ้ำ

### ค่าใน `.env` (ถ้าตั้งเอง)

```env
PORT=3001               # ไม่ใส่ก็ใช้ 3001
SUPABASE_URL=http://127.0.0.1:8000   # ที่อยู่ PostgREST ของฐานข้อมูล (หรือ https://xxxx.supabase.co ถ้าใช้ Supabase)
SUPABASE_KEY=...        # JWT สิทธิ์ระดับ service ของฐานข้อมูล เก็บฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใส่ในหน้าเว็บ
JWT_SECRET=...          # สตริงยาวสุ่มเอง
CORS_ORIGINS=https://pos.bittern-komodo.ts.net   # ไม่บังคับ คั่นหลายโดเมนด้วยจุลภาค
```

ไฟล์ `.env` ห้ามขึ้น git (`local/.env` ก็เช่นกัน)

## ฐานข้อมูล

ใช้ PostgreSQL ชุดที่ `docker compose` ข้างบนสร้างให้ ไฟล์ที่ถูกโหลดตามลำดับตอนสร้างครั้งแรก:

1. `local/db/00-init.sql` สร้าง role ที่ PostgREST ใช้ (`anon`, `authenticated`, `service_role`, `authenticator`)
2. `database_master_setup.sql` สร้างตารางทั้งหมดและบัญชีทดลอง
3. `local/db/02-lock-anon.sql` ปิดสิทธิ์ผู้ใช้ที่ยังไม่ล็อกอิน ให้อ่านได้เฉพาะข้อมูลที่หน้าเว็บใช้ตรงๆ
4. `local/db/03-held-bills-shop-id.sql` เพิ่มคอลัมน์ `shop_id` ของบิลที่พัก

ถ้าจะใช้ PostgreSQL ของตัวเองหรือ Supabase: สร้าง role 4 ตัวตามข้อ 1 (Supabase มีให้แล้ว) แล้วรันไฟล์ข้อ 2-4 ด้วย `psql` ส่วน `reset_database.sql` ล้างข้อมูลทั้งหมด ใช้เฉพาะตอนพัฒนา
`additional_seed_data.sql` คือข้อมูลตัวอย่างเพิ่มเติม (ไม่บังคับ)

## คำสั่งที่ใช้บ่อย

```bash
npm run build        # คอมไพล์เป็น dist/
npm run start:prod   # รัน dist/main
npm run test         # unit test
npm run lint
```

## รันจริงบนคอม

ตั้งค่าบนเครื่องคอมที่จะเป็นเซิร์ฟเวอร์ ใช้ขั้นตอนเดียวกับ "รันในเครื่อง" ด้านบน (ฐานข้อมูลด้วย Docker, API ด้วย Node) แต่รันแบบ production:

```bash
npm ci
npm run build
npm run start:prod
```

ให้รันค้างไว้และเปิดใหม่เองเมื่อเครื่องรีสตาร์ท ด้วย pm2:

```bash
npm i -g pm2
pm2 start dist/main.js --name smartpos-api
pm2 save
```

ถ้าให้เครื่องอื่นเข้าถึง: ใส่โดเมนหรือที่อยู่ของหน้าเว็บใน `CORS_ORIGINS` ในไฟล์ `.env` แล้วเปิดพอร์ต 3001 (หรือวางหลัง nginx) เปลี่ยน `JWT_SECRET` และรหัสบัญชีทดลองก่อนใช้งานจริง

ถ้าอยากรันเป็น container มี `Dockerfile` ให้ (build แล้วรัน `dist/main`)

## โครงสร้างโฟลเดอร์

```
src/auth/        ล็อกอิน JWT และตรวจสิทธิ์
src/supabase/    ตัวเชื่อมฐานข้อมูล PostgreSQL
src/common/      filter และตัวช่วยกลาง
src/products/ src/sales/ src/customers/ ...   โมดูลละเรื่อง
local/           ชุดฐานข้อมูลสำหรับรันในเครื่อง (docker compose, SQL เริ่มต้น, ตัวสร้างกุญแจ)
test/            e2e test
```
