-- ปิดสิทธิ์ของผู้ใช้ที่ไม่ได้ล็อกอิน (role anon / authenticated) ผ่าน PostgREST (/rest/v1)
-- เดิม: anon อ่าน/เขียน/ลบได้ทุกตาราง รวมถึง admins.password_hash — ใครก็ตามที่เปิดเว็บได้จะทำได้ทั้งหมด
-- ใหม่: anon อ่านได้เฉพาะข้อมูลที่หน้าเว็บใช้ตรงๆ (ชื่อร้าน + โปรโมชันบนจอลูกค้า) ที่เหลือต้องผ่าน backend (service_role)

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

-- backend ใช้ service_role: ต้องเรียกฟังก์ชันได้เหมือนเดิม
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- สิ่งที่หน้าเว็บอ่านตรงจากฐานข้อมูล (app/admin/layout.tsx, app/customer-display/page.tsx)
GRANT SELECT (shop_name) ON public.admins         TO anon;
GRANT SELECT (name)      ON public.store_settings TO anon;
GRANT SELECT             ON public.promotions     TO anon;

NOTIFY pgrst, 'reload schema';
