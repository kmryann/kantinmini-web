import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PosPage() {
  // Sesuai arsitektur role baru: POS dipindahkan ke halaman kasir khusus /cashier
  redirect("/cashier");
}
