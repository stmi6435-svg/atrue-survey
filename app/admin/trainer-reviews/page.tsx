import Link from "next/link";
import { AdminReviewTable } from "@/features/trainer-admin/AdminReviewTable";
import { TrainerAdminGuard } from "@/features/trainer-admin/TrainerAdminGuard";

export default function TrainerReviewsAdminPage() {
  return (
    <TrainerAdminGuard>
      <main className="min-h-screen px-5 py-6 text-[#262320] sm:py-10">
        <section className="mx-auto w-full max-w-6xl">
          <nav className="mb-5 flex flex-wrap gap-2 text-sm font-black">
            <Link href="/admin" className="rounded-full bg-white px-4 py-2 text-[#6F553C] shadow-[0_8px_22px_rgba(38,35,32,0.06)]">
              기존 관리자 홈
            </Link>
            <Link href="/admin/trainers" className="rounded-full bg-white px-4 py-2 text-[#6F553C] shadow-[0_8px_22px_rgba(38,35,32,0.06)]">
              트레이너 관리
            </Link>
          </nav>
          <AdminReviewTable />
        </section>
      </main>
    </TrainerAdminGuard>
  );
}
