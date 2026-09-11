"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Email/password registration has been removed. Account creation now happens
 * exclusively through Google OAuth, so this route redirects to the login page.
 */
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return null;
}
