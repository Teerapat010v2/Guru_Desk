// หน้าเว็บจริงคือ public/index.html (แอปเดิม) — Next.js ทำหน้าที่เปิดไฟล์และส่ง /api ต่อให้ backend
// ต้องมี layout ตาม App Router แม้ยังไม่มีหน้าที่เขียนด้วย React
export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
