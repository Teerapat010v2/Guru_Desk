import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "800"],
});

export const metadata = {
  title: "Guru IT Service Desk",
  description: "แจ้งปัญหาไอที ติดตามงาน และเซ็นรับงาน — Guru IT Solution",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={prompt.className}>{children}</body>
    </html>
  );
}
