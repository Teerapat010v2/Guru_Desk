import { Prompt } from "next/font/google";
// สไตล์ของแอปเดิม (สี โหมดกลางคืน ปุ่ม ฟอร์ม) โหลดก่อน แล้ว globals.css ของหน้าที่ยังไม่ได้ย้ายดีไซน์ทับเฉพาะที่ชนกัน
import "./style.css";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "800"],
});

export const metadata = {
  title: "Guru IT Service Desk",
  description: "แจ้งปัญหาไอที ติดตามงาน และเซ็นรับงาน — Guru IT Solution",
  icons: { icon: "/icon-192.png", apple: "/icon-180.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" data-theme="light" suppressHydrationWarning>
      <head>
        {/* ตั้งโหมดสีก่อนวาดหน้า ไม่ให้จอกระพริบ (คีย์เดียวกับแอปเดิม) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("gitsd-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`,
          }}
        />
      </head>
      <body className={prompt.className}>{children}</body>
    </html>
  );
}
