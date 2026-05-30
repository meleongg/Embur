import { signUpAction } from "@/app/actions";
import type { ReactNode } from "react";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dumbbell } from "lucide-react";
import Link from "next/link";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  const cardShell = (content: ReactNode) => (
    <div className="w-full max-w-md">
      <div className="bg-card p-8 rounded-xl border border-border/60 shadow-sm">
        {content}
      </div>
    </div>
  );

  if ("message" in searchParams) {
    return cardShell(
      <>
        <div className="flex justify-center mb-4">
          <div className="bg-primary p-3 rounded-full">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <FormMessage message={searchParams} />
      </>
    );
  }

  return cardShell(
    <>
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary p-3 rounded-full">
            <Dumbbell className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Start logging with Embur
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            name="email"
            id="email"
            placeholder="you@example.com"
            type="email"
            className="w-full h-10 px-3 py-2 border rounded-md"
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
            className="w-full h-10 px-3 py-2 border rounded-md"
            minLength={6}
            required
          />
          <p className="text-xs text-muted-foreground">
            Password must be at least 6 characters long
          </p>
        </div>

        <div className="mt-3">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms-agreement"
              name="terms-agreement"
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              required
            />
            <label
              htmlFor="terms-agreement"
              className="ml-2 text-xs text-muted-foreground"
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
              <span className="text-destructive ml-1">*</span>
            </label>
          </div>
          <div
            className="text-xs text-destructive mt-1 hidden"
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
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity mt-2"
        >
          Create account
        </SubmitButton>
      </form>

      <div className="text-center mt-6">
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
