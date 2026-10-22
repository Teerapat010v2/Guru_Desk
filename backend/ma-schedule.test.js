// รัน: node ma-schedule.test.js (ไม่ต้องใช้ฐานข้อมูล)
import assert from 'node:assert/strict';
import { daysInMonth, dueDay, monthKey, dueDateThisMonth, nextDueDate, isDue } from './ma-schedule.js';

assert.equal(daysInMonth(2026, 1), 28);            // ก.พ. 2569 (ค.ศ. 2026) ไม่ใช่ปีอธิกสุรทิน
assert.equal(daysInMonth(2028, 1), 29);            // ปีอธิกสุรทิน
assert.equal(dueDay(2026, 1, 31), 28);             // 31 → วันสุดท้ายของ ก.พ.
assert.equal(dueDay(2026, 3, 31), 30);             // 31 → 30 เม.ย.
assert.equal(dueDay(2026, 9, 15), 15);             // วันปกติไม่เปลี่ยน
assert.equal(monthKey(new Date(2026, 9, 5)), '2026-10');
assert.equal(dueDateThisMonth(new Date(2026, 1, 10), 30), '2026-02-28');
assert.equal(isDue(new Date(2026, 9, 14), 15), false);  // ยังไม่ถึง
assert.equal(isDue(new Date(2026, 9, 15), 15), true);   // วันกำหนด
assert.equal(isDue(new Date(2026, 9, 20), 15), true);   // เลยมาแล้ว (สร้างย้อนหลังในเดือนเดียวกัน)
assert.equal(isDue(new Date(2026, 1, 28), 31), true);   // ก.พ. วันที่ 28 = วันสุดท้าย ถึงกำหนดของ "31"
assert.equal(nextDueDate(new Date(2026, 9, 5), 15, '2026-09'), '2026-10-15');   // เดือนนี้ยังไม่สร้าง
assert.equal(nextDueDate(new Date(2026, 9, 20), 15, '2026-10'), '2026-11-15');  // สร้างแล้ว → เดือนหน้า
assert.equal(nextDueDate(new Date(2026, 0, 20), 31, '2026-01'), '2026-02-28');  // เดือนหน้าสั้นกว่า
assert.equal(nextDueDate(new Date(2026, 11, 20), 10, '2026-12'), '2027-01-10'); // ข้ามปี
console.log('ma-schedule: all tests passed');
