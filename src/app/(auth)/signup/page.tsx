import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SignUpForm } from "./SignUpForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Create Account",
  robots: { index: false },
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="So we can confirm your order and keep you updated on it."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/signin" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-72" />}>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
