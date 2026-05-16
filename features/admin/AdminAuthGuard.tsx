"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.replace("/admin/login");
        return;
      }

      setIsAllowed(true);
      setIsChecking(false);
    }

    void checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsAllowed(false);
        router.replace("/admin/login");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [router]);

  if (isChecking || !isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9EF] px-5 text-[#262320]">
        <div className="rounded-3xl border border-[#EFE0CD] bg-white px-6 py-5 text-sm font-bold shadow-[0_18px_60px_rgba(38,35,32,0.10)]">
          관리자 세션을 확인하는 중입니다.
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
