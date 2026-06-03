import { signInAction } from "@/app/actions";
import AuthFormHeader from "@/components/auth-form-header";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";

const AUTH_INPUT_CLASS =
  "w-full h-12 min-h-12 px-4 py-3 text-base border rounded-lg";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="w-full max-w-md">
      <div className="bg-card p-6 sm:p-8 rounded-xl border border-border/60 shadow-sm">
        <AuthFormHeader title="Welcome back" subtitle="Sign in to Embur" />

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
            <div className="flex justify-between items-center gap-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                className="text-xs text-primary hover:underline shrink-0"
                href="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="Your password"
              className={AUTH_INPUT_CLASS}
              required
            />
          </div>

          <FormMessage message={searchParams} />

          <SubmitButton
            pendingText="Signing In..."
            formAction={signInAction}
            className={cn(
              "w-full h-12 bg-primary text-primary-foreground rounded-lg",
              "font-medium hover:opacity-90 transition-opacity mt-1"
            )}
          >
            Sign in
          </SubmitButton>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              className="text-primary font-medium hover:underline"
              href="/sign-up"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
