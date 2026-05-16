import { SubmissionDetail } from "@/features/admin/SubmissionDetail";

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  return <SubmissionDetail id={params.id} />;
}
