import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminReviewTable } from "@/features/trainer-admin/AdminReviewTable";
import { TrainerAdminGuard } from "@/features/trainer-admin/TrainerAdminGuard";

export default function TrainerReviewsAdminPage() {
  return (
    <TrainerAdminGuard>
      <AdminLayout>
        <AdminReviewTable />
      </AdminLayout>
    </TrainerAdminGuard>
  );
}
