import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { AdminHome } from "@/features/admin/AdminHome";

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminLayout>
        <AdminHome />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
