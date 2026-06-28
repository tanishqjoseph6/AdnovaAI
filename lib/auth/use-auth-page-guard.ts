"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isEmailVerified } from "@/lib/auth/email-verified";
import { supabase } from "@/lib/supabase";

export function useAuthPageGuard() {
  const router = useRouter();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        return;
      }

      if (isEmailVerified(user)) {
        router.replace("/dashboard");
        return;
      }

      router.replace("/verify-email");
    });
  }, [router]);
}
