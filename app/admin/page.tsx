import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
