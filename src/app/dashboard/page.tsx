import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";

export const metadata: Metadata = {
  title: "Mi panel",
  description:
    "Tu panel Premium de CostoReal: resumen, productos guardados, edición, Excel y PDF.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <Dashboard />;
}
