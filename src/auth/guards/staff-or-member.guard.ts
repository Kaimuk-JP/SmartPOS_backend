import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyMemberToken, verifyStaffToken } from '../member-token';

// ให้ผ่านเมื่อเป็นพนักงาน/แอดมิน (โทเคนปกติ) หรือเป็นสมาชิกที่ขอดูข้อมูล "ของตัวเอง" เท่านั้น
// ใช้กับ route ที่มีพารามิเตอร์ :id หรือ :customerId เป็นรหัสลูกค้า
@Injectable()
export class StaffOrMemberGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const bearer = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '');
    const staffToken = req.cookies?.access_token || bearer;
    if (staffToken) {
      const staff = verifyStaffToken(staffToken);
      if (staff) {
        req.user = { userId: staff.sub, username: staff.username, role: staff.role, shopName: staff.shopName, shopId: staff.shopId };
        return true;
      }
    }
    const memberToken = String(req.headers?.['x-member-token'] || '');
    if (memberToken) {
      const m = verifyMemberToken(memberToken);
      if (m) {
        const target = req.params?.customerId ?? req.params?.id;
        if (String(m.customerId) === String(target)) { req.member = m; return true; }
        throw new ForbiddenException('ดูได้เฉพาะข้อมูลของตัวเอง');
      }
    }
    throw new UnauthorizedException();
  }
}
