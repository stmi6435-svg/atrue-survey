import { SATISFACTION_CLOSED_MESSAGE } from "@/features/satisfaction/constants";

export default function SatisfactionClosedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-charcoal">
      <section className="w-full max-w-lg rounded-3xl border border-oatmeal bg-white p-6 text-center shadow-soft sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-clay">ATRUEGYM SATISFACTION</p>
        <h1 className="mt-4 text-2xl font-black leading-tight">{SATISFACTION_CLOSED_MESSAGE.title}</h1>
        <p className="mt-4 whitespace-pre-line text-base font-medium leading-7 text-charcoal/70">{SATISFACTION_CLOSED_MESSAGE.body}</p>
      </section>
    </main>
  );
}
