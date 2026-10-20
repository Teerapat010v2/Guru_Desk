import { Suspense } from "react";
import ReportView from "./report-view";

// เลขงานอ่านจาก URL ที่ฝั่ง server แล้วส่งให้หน้าพิมพ์ (Suspense ตามกติกา cacheComponents)
async function Loader({ params }) {
  const { id } = await params;
  return <ReportView id={id} />;
}

export default function Page({ params }) {
  return (
    <Suspense fallback={<main className="report"><p>กำลังโหลด…</p></main>}>
      <Loader params={params} />
    </Suspense>
  );
}
