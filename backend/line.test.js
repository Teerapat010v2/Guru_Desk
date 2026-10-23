// node backend/line.test.js
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { validSignature } from './line.js';

const body = Buffer.from('{"events":[]}'), secret = 's3cret';
const sig = createHmac('sha256', secret).update(body).digest('base64');
assert.equal(validSignature(body, sig, secret), true);
assert.equal(validSignature(Buffer.from('{"events":[1]}'), sig, secret), false);   // เนื้อหาถูกแก้
assert.equal(validSignature(body, sig, 'other'), false);                              // secret ผิด
assert.equal(validSignature(body, '', secret), false);                                // ไม่มี header
assert.equal(validSignature(body, sig, ''), false);                                   // ยังไม่ตั้ง secret
console.log('line.test ok');
