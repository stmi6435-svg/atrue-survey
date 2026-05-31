import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export default function SurveyAdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}
