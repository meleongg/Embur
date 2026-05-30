"use client";

import MarketingBrand from "@/components/marketing-brand";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MarketingNav() {
  const pathname = usePathname();
  const isSignIn = pathname === "/sign-in";
  const isSignUp = pathname === "/sign-up";
  const isForgotPassword = pathname === "/forgot-password";

  return (
    <nav className="bg-card border-b border-border shadow-sm shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link
            href="/"
            className="hover:opacity-90 transition-opacity"
          >
            <MarketingBrand logoSize={32} />
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {isForgotPassword && (
              <Link
                href="/sign-in"
                className="text-muted-foreground hover:text-primary transition-colors px-3 py-2 text-sm sm:text-base font-medium"
              >
                Back to sign in
              </Link>
            )}
            {!isSignIn && !isForgotPassword && (
              <Link
                href="/sign-in"
                className="text-muted-foreground hover:text-primary transition-colors px-3 py-2 text-sm sm:text-base"
              >
                Sign in
              </Link>
            )}
            {!isSignUp && !isForgotPassword && (
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:opacity-90 transition-opacity"
              >
                Sign up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
