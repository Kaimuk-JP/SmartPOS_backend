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

ต้องมี Node 20 ขึ้นไป

```bash
npm install
cp .env.example .env     # แล้วแก้ค่าในไฟล์
npm run start:dev
```

API ทำงานที่ http://localhost:3001/api (พอร์ตตั้งได้ด้วย `PORT`)

ค่าใน `.env`:

```env
SUPABASE_URL=http://127.0.0.1:3000   # ที่อยู่ PostgREST ของฐานข้อมูล (หรือ https://xxxx.supabase.co ถ้าใช้ Supabase)
SUPABASE_KEY=...        # JWT สิทธิ์ระดับ service ของฐานข้อมูล เก็บฝั่งเซิร์ฟเวอร์เท่านั้น ห้ามใส่ในหน้าเว็บ
JWT_SECRET=...          # สตริงยาวสุ่มเอง
PORT=3001               # ไม่ใส่ก็ใช้ 3001
CORS_ORIGINS=https://pos.bittern-komodo.ts.net   # ไม่บังคับ คั่นหลายโดเมนด้วยจุลภาค
```

ไฟล์ `.env` ห้ามขึ้น git

## ฐานข้อมูล

สคริปต์ SQL อยู่ที่รากของ repo รันตามลำดับนี้ด้วย `psql` (หรือ SQL editor ของ Supabase ถ้าใช้ Supabase):

1. `database_master_setup.sql` สร้างตารางทั้งหมด
2. `fix_permissions.sql` ตั้งสิทธิ์
3. `additional_seed_data.sql` ข้อมูลตัวอย่าง (ไม่บังคับ)

`reset_database.sql` ล้างข้อมูลทั้งหมด ใช้เฉพาะตอนพัฒนา

## คำสั่งที่ใช้บ่อย

```bash
npm run build        # คอมไพล์เป็น dist/
npm run start:prod   # รัน dist/main
npm run test         # unit test
npm run lint
```

## การนำขึ้นใช้งาน

ตัวที่ใช้อยู่ตอนนี้รันบนมือถือ Android (Termux) เปิดให้เข้าได้ที่ https://pos.bittern-komodo.ts.net/ ผ่าน Tailscale Funnel ทุกครั้งที่ push เข้า `main` workflow `.github/workflows/phone-release.yml` จะ build แล้วสร้าง release จากนั้นสั่งมือถือให้ดึงรุ่นใหม่ไปรันเอง (`node_modules` ติดตั้งบนมือถือ เพราะ bcrypt ต้องคอมไพล์สำหรับ Android) ไม่ต้องใช้ Docker ต้องตั้ง secret `TS_AUTHKEY` และ `DEPLOY_TOKEN` ใน repo

ถ้าอยากรันเป็น container มี `Dockerfile` ให้

## โครงสร้างโฟลเดอร์

```
src/auth/        ล็อกอิน JWT และตรวจสิทธิ์
src/supabase/    ตัวเชื่อมฐานข้อมูล PostgreSQL
src/common/      filter และตัวช่วยกลาง
src/products/ src/sales/ src/customers/ ...   โมดูลละเรื่อง
test/            e2e test
```
