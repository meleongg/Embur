import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardBody } from "@nextui-org/react";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  return (
    <div className="max-w-md mx-auto w-full">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        Reset password
      </h1>
      <Card className="border border-border/60 shadow-sm">
        <CardBody className="gap-4 p-6">
          <p className="text-sm text-muted-foreground">
            Please enter your new password below.
          </p>
          <form className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                type="password"
                name="password"
                id="password"
                placeholder="New password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                placeholder="Confirm password"
                required
              />
            </div>
            <FormMessage message={searchParams} />
            <SubmitButton
              formAction={resetPasswordAction}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Reset password
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
