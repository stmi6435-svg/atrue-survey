import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { SatisfactionAdminConsole } from "@/features/satisfaction/components/SatisfactionAdminConsole";

export default function SatisfactionStaffPage() {
  return (
    <AdminAuthGuard>
      <AdminLayout contentClassName="max-w-7xl">
        <SatisfactionAdminConsole activeTab="staff" />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
