import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { StaffOrMemberGuard } from './staff-or-member.guard';
import { signMemberToken, verifyStaffToken } from '../member-token';

const SECRET = 'test-secret-test-secret-test-secret-1234';
const jwt = new JwtService();

const ctx = (req: any): ExecutionContext => ({ switchToHttp: () => ({ getRequest: () => req }) }) as unknown as ExecutionContext;
const reqOf = (headers: Record<string, string>, params: Record<string, string>, cookies: Record<string, string> = {}) => ({ headers, params, cookies, user: undefined as any });

describe('StaffOrMemberGuard', () => {
  const guard = new StaffOrMemberGuard();
  beforeAll(() => { process.env.JWT_SECRET = SECRET; });

  it('rejects a request with no token', () => {
    expect(() => guard.canActivate(ctx(reqOf({}, { id: '5' })))).toThrow(UnauthorizedException);
  });

  it('lets a member read their own record', () => {
    const t = signMemberToken(5, 'SHOP');
    expect(guard.canActivate(ctx(reqOf({ 'x-member-token': t }, { id: '5' })))).toBe(true);
    expect(guard.canActivate(ctx(reqOf({ 'x-member-token': t }, { customerId: '5' })))).toBe(true);
  });

  it("blocks a member from another customer's record", () => {
    const t = signMemberToken(5, 'SHOP');
    expect(() => guard.canActivate(ctx(reqOf({ 'x-member-token': t }, { id: '6' })))).toThrow(ForbiddenException);
  });

  it('lets staff and admin through (header or cookie)', () => {
    const staff = jwt.sign({ sub: 1, username: 'a', role: 'staff', shopId: 'S' }, { secret: SECRET });
    const admin = jwt.sign({ sub: 2, username: 'b', role: 'admin', shopId: 'S' }, { secret: SECRET });
    expect(guard.canActivate(ctx(reqOf({ authorization: 'Bearer ' + staff }, { id: '9' })))).toBe(true);
    expect(guard.canActivate(ctx(reqOf({}, { id: '9' }, { access_token: admin })))).toBe(true);
  });

  it('rejects tokens signed with a different secret or with an unknown role', () => {
    const forged = jwt.sign({ sub: 1, role: 'admin' }, { secret: 'some-other-secret-some-other-secret' });
    const norole = jwt.sign({ sub: 1, role: 'guest' }, { secret: SECRET });
    expect(() => guard.canActivate(ctx(reqOf({ authorization: 'Bearer ' + forged }, { id: '1' })))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(ctx(reqOf({ authorization: 'Bearer ' + norole }, { id: '1' })))).toThrow(UnauthorizedException);
  });

  it('a member token is NOT accepted as a staff token (cannot reach staff-only routes)', () => {
    const t = signMemberToken(5, 'SHOP');
    expect(verifyStaffToken(t)).toBeNull();
  });

  it('a staff token is NOT accepted as a member token', () => {
    const staff = jwt.sign({ sub: 1, role: 'staff' }, { secret: SECRET });
    expect(() => guard.canActivate(ctx(reqOf({ 'x-member-token': staff }, { id: '1' })))).toThrow(UnauthorizedException);
  });
});
