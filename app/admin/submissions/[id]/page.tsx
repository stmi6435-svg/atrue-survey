import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { SubmissionDetail } from "@/features/admin/SubmissionDetail";

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  return (
    <AdminAuthGuard>
      <SubmissionDetail id={params.id} />
    </AdminAuthGuard>
  );
}
