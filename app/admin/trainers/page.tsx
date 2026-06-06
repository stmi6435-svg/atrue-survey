import { AdminLayout } from "@/components/admin/AdminLayout";
import { TrainerAdminGuard } from "@/features/trainer-admin/TrainerAdminGuard";
import { TrainerManager } from "@/features/trainer-admin/TrainerManager";

export default function TrainersAdminPage() {
  return (
    <TrainerAdminGuard>
      <AdminLayout contentClassName="max-w-4xl">
        <TrainerManager />
      </AdminLayout>
    </TrainerAdminGuard>
  );
}
