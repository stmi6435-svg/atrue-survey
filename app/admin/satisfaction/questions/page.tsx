import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { SatisfactionAdminConsole } from "@/features/satisfaction/components/SatisfactionAdminConsole";

export default function SatisfactionQuestionsPage() {
  return (
    <AdminAuthGuard>
      <AdminLayout contentClassName="max-w-7xl">
        <SatisfactionAdminConsole activeTab="questions" />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
