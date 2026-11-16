import { JwtService } from '@nestjs/jwt';

// โทเคนของสมาชิก (ลูกค้า) แยกจากโทเคนพนักงาน: เซ็นด้วยกุญแจคนละดอก
// จึงเอาไปใช้กับ endpoint ของพนักงานไม่ได้ (JwtAuthGuard ตรวจด้วยกุญแจหลัก) และใช้ได้เฉพาะข้อมูลของสมาชิกคนนั้น
const jwt = new JwtService();
const mainSecret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is required');
  return s;
};
const memberSecret = (): string => mainSecret() + ':member';

export function signMemberToken(customerId: number, shopId?: string): string {
  return jwt.sign({ typ: 'member', customerId, shopId }, { secret: memberSecret(), expiresIn: '12h' });
}

export function verifyMemberToken(token: string): { customerId: number; shopId?: string } | null {
  try {
    const p: any = jwt.verify(token, { secret: memberSecret() });
    return p && p.typ === 'member' && Number.isFinite(Number(p.customerId)) ? { customerId: Number(p.customerId), shopId: p.shopId } : null;
  } catch {
    return null;
  }
}

export function verifyStaffToken(token: string): any | null {
  try {
    const p: any = jwt.verify(token, { secret: mainSecret() });
    return p && ['admin', 'staff', 'superadmin'].includes(p.role) ? p : null;
  } catch {
    return null;
  }
}
