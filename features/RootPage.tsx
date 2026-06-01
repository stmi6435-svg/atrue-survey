"use client";

import { useEffect, useState } from "react";
import { AdminForgotPassword } from "@/features/admin/AdminForgotPassword";
import { AdminResetPassword } from "@/features/admin/AdminResetPassword";
import { SurveyApp } from "@/features/survey/SurveyApp";

export function RootPage() {
  const [pathname, setPathname] = useState("");

  useEffect(() => {
    setPathname(window.location.pathname.replace(/\/$/, ""));
  }, []);

  if (pathname === "/admin/reset-password") {
    return <AdminResetPassword />;
  }

  if (pathname === "/admin/forgot-password") {
    return <AdminForgotPassword />;
  }

  return <SurveyApp />;
}
