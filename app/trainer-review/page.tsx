import { ReviewForm } from "@/features/trainer-review/components/ReviewForm";

export default function TrainerReviewPage() {
  return (
    <main className="min-h-screen px-5 py-6 text-[#262320] sm:py-10">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6 rounded-[2rem] border border-[#EFE0CD] bg-white/90 p-5 shadow-[0_18px_60px_rgba(38,35,32,0.10)] sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#B67854]">ATRUEGYM REVIEW</p>
          <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">트레이너 평가</h1>
          <p className="mt-4 text-base font-medium leading-7 text-[#262320]/70">
            회원님의 솔직한 평가가 더 좋은 수업을 만드는 데 큰 도움이 됩니다. 1분 안에 편하게 남겨 주세요.
          </p>
        </div>
        <ReviewForm />
      </section>
    </main>
  );
}
