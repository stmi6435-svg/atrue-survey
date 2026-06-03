import { AdminAuthGuard } from "@/features/admin/AdminAuthGuard";
import { SatisfactionAdminConsole } from "@/features/satisfaction/components/SatisfactionAdminConsole";

export default function SatisfactionSurveysPage() {
  return (
    <AdminAuthGuard>
      <main className="min-h-screen bg-ivory px-5 py-6 text-charcoal sm:py-10">
        <section className="mx-auto w-full max-w-7xl">
          <SatisfactionAdminConsole activeTab="surveys" />
        </section>
      </main>
    </AdminAuthGuard>
  );
}
