"use client";

import {
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Star,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type AdminLayoutProps = {
  children: ReactNode;
  contentClassName?: string;
};

type AdminMenuItem = {
  label: string;
  href?: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
};

const adminMenu: AdminMenuItem[] = [
  {
    label: "대시보드",
    href: "/admin",
    icon: LayoutDashboard,
    match: (pathname) => pathname === "/admin",
  },
  {
    label: "분기별 설문조사",
    href: "/admin/satisfaction",
    icon: ClipboardList,
    match: (pathname) => pathname.startsWith("/admin/satisfaction"),
  },
  {
    label: "PT 회원",
    icon: UserRound,
  },
  {
    label: "PT 사전 설문조사",
    href: "/admin/surveys",
    icon: FileText,
    match: (pathname) => pathname.startsWith("/admin/surveys") || pathname.startsWith("/admin/submissions"),
  },
  {
    label: "트레이너 평가",
    href: "/admin/trainer-reviews",
    icon: Star,
    match: (pathname) => pathname.startsWith("/admin/trainer-reviews"),
  },
  {
    label: "트레이너 관리",
    href: "/admin/trainers",
    icon: UsersRound,
    match: (pathname) => pathname.startsWith("/admin/trainers"),
  },
  {
    label: "트레이너별 PT티 시간표",
    icon: CalendarDays,
  },
  {
    label: "트레이너 급여",
    icon: WalletCards,
  },
];

const pageMeta = [
  {
    match: (pathname: string) => pathname === "/admin",
    title: "대시보드",
    description: "분기별 설문조사와 트레이너 평가의 핵심 지표를 미리 확인합니다.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/admin/satisfaction"),
    title: "분기별 설문조사",
    description: "만족도 설문, 응답, 질문, 회차, 직원을 관리합니다.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/admin/trainer-reviews"),
    title: "트레이너 평가",
    description: "트레이너별 PT 평가 데이터를 확인하고 관리합니다.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/admin/trainers"),
    title: "트레이너 관리",
    description: "평가 페이지에 노출되는 트레이너 정보를 관리합니다.",
  },
  {
    match: (pathname: string) => pathname.startsWith("/admin/surveys") || pathname.startsWith("/admin/submissions"),
    title: "PT 사전 설문조사",
    description: "PT 사전 설문 제출 현황과 상세 응답을 관리합니다.",
  },
];

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function AdminLayout({ children, contentClassName }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentMeta = pageMeta.find((meta) => meta.match(pathname)) ?? pageMeta[0];

  async function handleLogout() {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-[#18181b]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#101114] text-white shadow-[18px_0_45px_rgba(16,17,20,0.16)] lg:flex">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d8b64c] text-sm font-black text-[#101114]">
              A
            </span>
            <span>
              <span className="block text-base font-black leading-none tracking-wide">ATRUE</span>
              <span className="mt-1 block text-xs font-bold uppercase tracking-[0.18em] text-white/45">Admin</span>
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-5" aria-label="관리자 메뉴">
          {adminMenu.map((item) => (
            <AdminSidebarItem key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((current) => !current)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 lg:hidden"
                aria-label="관리자 메뉴 열기"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
              </button>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#9a7a2f]">ATRUE Admin</p>
                <h1 className="mt-1 truncate text-xl font-black text-[#18181b]">{currentMeta.title}</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition hover:border-[#4e5434] hover:text-[#101114]"
              aria-label="로그아웃"
              title="로그아웃"
            >
              <LogOut size={18} aria-hidden />
            </button>
          </div>

          {isMobileMenuOpen ? (
            <nav className="border-t border-zinc-200 bg-[#101114] px-4 py-3 lg:hidden" aria-label="모바일 관리자 메뉴">
              <div className="grid gap-1">
                {adminMenu.map((item) => (
                  <AdminMobileItem key={item.label} item={item} pathname={pathname} onNavigate={() => setIsMobileMenuOpen(false)} />
                ))}
              </div>
            </nav>
          ) : null}
        </header>

        <main className="min-h-[calc(100vh-56px)] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className={classNames("mx-auto w-full max-w-[1180px]", contentClassName)}>
            <p className="mb-4 hidden text-sm font-semibold text-zinc-500 sm:block">{currentMeta.description}</p>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function AdminSidebarItem({ item, pathname }: { item: AdminMenuItem; pathname: string }) {
  const Icon = item.icon;
  const isActive = item.href ? item.match?.(pathname) ?? pathname === item.href : false;

  if (!item.href) {
    return (
      <span className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-white/35">
        <Icon size={18} aria-hidden />
        <span className="truncate">{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      className={classNames(
        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition",
        isActive
          ? "bg-[#4e5434] text-[#ffd84d] shadow-[inset_3px_0_0_#ffd84d]"
          : "text-white/72 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={18} aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function AdminMobileItem({ item, pathname, onNavigate }: { item: AdminMenuItem; pathname: string; onNavigate: () => void }) {
  const Icon = item.icon;
  const isActive = item.href ? item.match?.(pathname) ?? pathname === item.href : false;
  const className = classNames(
    "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold",
    isActive
      ? "bg-[#4e5434] text-[#ffd84d]"
      : item.href
        ? "text-white/72 hover:bg-white/10 hover:text-white"
        : "text-white/35",
  );

  if (!item.href) {
    return (
      <span className={className}>
        <Icon size={16} aria-hidden />
        {item.label}
      </span>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      <Icon size={16} aria-hidden />
      {item.label}
    </Link>
  );
}
