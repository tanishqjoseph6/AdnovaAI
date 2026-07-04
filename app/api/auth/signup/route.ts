import { NextResponse } from "next/server";
import { mapAuthErrorMessage } from "@/lib/auth/errors";
import { authError, authLog, authWarn } from "@/lib/auth/logger";
import { getAuthCallbackUrl } from "@/lib/auth/redirects";
import { signUpWithEmailVerification } from "@/lib/auth/signup";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const referralCode = typeof body?.referralCode === "string"
      ? body.referralCode
      : undefined;

    const emailRedirectTo = getAuthCallbackUrl("/dashboard");

    authLog("signup", "Signup requested", { email, emailRedirectTo });

    const result = await signUpWithEmailVerification(
      email,
      password,
      emailRedirectTo,
      referralCode
    );

    if (!result.ok) {
      authWarn("signup", "Signup failed", { email, error: result.error });
      return NextResponse.json(
        { error: mapAuthErrorMessage(result.error) },
        { status: result.status }
      );
    }

    authLog("signup", "Signup succeeded — verification email sent", { email });

    return NextResponse.json({
      success: true,
      message:
        "Check your email to confirm your account before signing in.",
    });
  } catch (error) {
    authError("signup", "Unexpected signup error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}
