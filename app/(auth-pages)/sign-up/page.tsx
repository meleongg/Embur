import { signUpAction } from "@/app/actions";
import type { ReactNode } from "react";
import AuthFormHeader from "@/components/auth-form-header";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";

const AUTH_INPUT_CLASS =
  "w-full h-12 min-h-12 px-4 py-3 text-base border rounded-lg";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  const cardShell = (content: ReactNode) => (
    <div className="w-full max-w-md">
      <div className="bg-card p-6 sm:p-8 rounded-xl border border-border/60 shadow-sm">
        {content}
      </div>
    </div>
  );

  if ("message" in searchParams) {
    return cardShell(
      <>
        <AuthFormHeader
          title="Check your email"
          subtitle="We sent you a confirmation link"
        />
        <FormMessage message={searchParams} />
      </>
    );
  }

  return cardShell(
    <>
      <AuthFormHeader
        title="Create an account"
        subtitle="Start logging with Embur"
      />

      <form className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            name="email"
            id="email"
            placeholder="you@example.com"
            type="email"
            className={AUTH_INPUT_CLASS}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Input
            type="password"
            id="password"
            name="password"
            placeholder="Create a password"
            className={AUTH_INPUT_CLASS}
            minLength={6}
            required
          />
          <p className="text-xs text-muted-foreground pt-0.5">
            Password must be at least 6 characters long
          </p>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms-agreement"
              name="terms-agreement"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary"
              required
            />
            <label
              htmlFor="terms-agreement"
              className="text-xs text-muted-foreground leading-relaxed"
            >
              I have read and agree to the{" "}
              <Link
                href="/terms-of-service"
                className="text-primary hover:underline"
                target="_blank"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="text-primary hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
              <span className="text-destructive ml-0.5">*</span>
            </label>
          </div>
          <div
            className="text-xs text-destructive mt-2 hidden"
            id="terms-error"
          >
            You must agree to the Terms of Service and Privacy Policy to
            continue
          </div>
        </div>

        <FormMessage message={searchParams} />

        <SubmitButton
          pendingText="Signing up..."
          formAction={signUpAction}
          className={cn(
            "w-full h-12 bg-primary text-primary-foreground rounded-lg",
            "font-medium hover:opacity-90 transition-opacity mt-1"
          )}
        >
          Create account
        </SubmitButton>
      </form>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            className="text-primary font-medium hover:underline"
            href="/sign-in"
          >
            Sign in
          </Link>
        </p>
      </div>
    </>
  );
}
