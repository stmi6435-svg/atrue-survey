import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export default function SurveyAdminPage() {
  return (
    <AdminAuthGuard>
      <AdminLayout contentClassName="max-w-7xl">
        <AdminDashboard />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
