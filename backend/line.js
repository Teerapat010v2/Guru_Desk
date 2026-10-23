// LINE Messaging API: ส่งแจ้งเตือนเข้า LINE ของผู้ใช้ที่ผูกบัญชีแล้ว + ตรวจลายเซ็น webhook
// ตั้งค่าใน .env: LINE_CHANNEL_TOKEN (Channel access token) · LINE_CHANNEL_SECRET · LINE_OA_ID (เช่น @guruit ใช้แสดงในหน้าเว็บ)
import { createHmac, timingSafeEqual } from 'node:crypto';

export const lineEnabled = () => !!process.env.LINE_CHANNEL_TOKEN;

export async function pushLine(to, text) {
  if (!lineEnabled() || !to) return false;
  const r = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}` },
    body: JSON.stringify({ to, messages: [{ type: 'text', text: String(text).slice(0, 4900) }] }),
  });
  if (!r.ok) console.error('line:', r.status, (await r.text()).slice(0, 200));
  return r.ok;
}

export async function replyLine(replyToken, text) {
  if (!lineEnabled() || !replyToken) return false;
  const r = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}` },
    body: JSON.stringify({ replyToken, messages: [{ type: 'text', text: String(text).slice(0, 4900) }] }),
  });
  if (!r.ok) console.error('line:', r.status, (await r.text()).slice(0, 200));
  return r.ok;
}

// webhook ของ LINE ส่ง HMAC-SHA256(secret, raw body) แบบ base64 มาใน header x-line-signature
export function validSignature(raw, header, secret = process.env.LINE_CHANNEL_SECRET) {
  if (!secret || !header) return false;
  const mac = createHmac('sha256', secret).update(raw).digest(), got = Buffer.from(header, 'base64');
  return got.length === mac.length && timingSafeEqual(got, mac);
}
