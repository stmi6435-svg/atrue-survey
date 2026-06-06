import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { SubmissionDetail } from "@/features/admin/SubmissionDetail";

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  return (
    <AdminAuthGuard>
      <AdminLayout contentClassName="max-w-5xl">
        <SubmissionDetail id={params.id} />
      </AdminLayout>
    </AdminAuthGuard>
  );
}
