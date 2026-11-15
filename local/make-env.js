// สร้างกุญแจสุ่มสำหรับรันในเครื่อง แล้วเขียนไฟล์ที่ต้องใช้:
//   local/.env        ใช้กับ docker compose
//   .env              ของ backend (ไม่ทับถ้ามีอยู่แล้ว ใช้ --force เพื่อทับ)
// ส่วนของหน้าเว็บ ให้ก๊อปบรรทัดที่สคริปต์พิมพ์ออกมาไปใส่ .env.local ของ SmartPOS_frontend
// ใช้: node local/make-env.js [--force]
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const force = process.argv.includes('--force');
const localEnv = path.join(__dirname, '.env');
const backendEnv = path.join(__dirname, '..', '.env');
const gatewayPort = process.env.GATEWAY_PORT || '8000';

if (fs.existsSync(localEnv) && !force) {
  console.error('มี local/.env อยู่แล้ว (ใช้ --force ถ้าต้องการสร้างใหม่ ฐานข้อมูลเดิมต้องลบ volume ด้วย: docker compose -f local/docker-compose.yml down -v)');
  process.exit(1);
}

const b64 = (b) => Buffer.from(b).toString('base64url');
const rand = (n) => crypto.randomBytes(n).toString('hex');
const jwtSecret = rand(32);
const sign = (role) => {
  const now = Math.floor(Date.now() / 1000);
  const body = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' + b64(JSON.stringify({ role, iss: 'smartpos-local', iat: now, exp: now + 10 * 365 * 86400 }));
  return body + '.' + crypto.createHmac('sha256', jwtSecret).update(body).digest('base64url');
};

const pgPassword = rand(16);
const anonKey = sign('anon');
const serviceKey = sign('service_role');
const appSecret = rand(32);

fs.writeFileSync(localEnv, [
  'POSTGRES_PASSWORD=' + pgPassword,
  'PGRST_JWT_SECRET=' + jwtSecret,
  'GATEWAY_PORT=' + gatewayPort,
  '',
].join('\n'));

if (!fs.existsSync(backendEnv) || force) {
  fs.writeFileSync(backendEnv, [
    'PORT=3001',
    'SUPABASE_URL=http://127.0.0.1:' + gatewayPort,
    'SUPABASE_KEY=' + serviceKey,
    'JWT_SECRET=' + appSecret,
    '',
  ].join('\n'));
  console.log('เขียน .env ของ backend แล้ว');
} else {
  console.log('มี .env ของ backend อยู่แล้ว ไม่ได้ทับ (ค่าใหม่สำหรับใส่เองอยู่ด้านล่าง)');
  console.log('SUPABASE_URL=http://127.0.0.1:' + gatewayPort);
  console.log('SUPABASE_KEY=' + serviceKey);
}

console.log('เขียน local/.env แล้ว');
console.log('');
console.log('ไฟล์ .env.local ของ SmartPOS_frontend:');
console.log('NEXT_PUBLIC_API_URL=http://localhost:3001/api');
console.log('NEXT_PUBLIC_SUPABASE_URL=http://localhost:' + gatewayPort);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=' + anonKey);
