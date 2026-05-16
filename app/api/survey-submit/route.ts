import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database, SurveySubmissionInsert } from "@/lib/supabase";

const TABLE_NAME = "pt_survey_submissions";

export async function POST(request: Request) {
  try {
    console.log("API survey submit called");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("API env check", {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseServiceRoleKey: Boolean(supabaseServiceRoleKey),
    });

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase 서버 환경 변수가 설정되지 않았습니다.");
    }

    const payload = (await request.json()) as SurveySubmissionInsert;
    console.log("API payload", payload);

    const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { error } = await supabase.from(TABLE_NAME).insert(payload);

    if (error) {
      console.error("API insert error", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "설문 제출 중 오류가 발생했습니다.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
