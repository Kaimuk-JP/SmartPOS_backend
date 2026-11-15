-- held_bills ไม่มีคอลัมน์ shop_id แต่ backend (held-bills.service.ts) ใช้กรองและบันทึกบิลพักตามร้าน
-- ทำให้หน้า "พักบิล" error: column held_bills.shop_id does not exist
ALTER TABLE public.held_bills ADD COLUMN IF NOT EXISTS shop_id TEXT;
CREATE INDEX IF NOT EXISTS held_bills_shop_id_idx ON public.held_bills (shop_id);
NOTIFY pgrst, 'reload schema';
