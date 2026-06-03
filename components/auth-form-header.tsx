"use client";

import EmburLogo from "@/components/embur-logo";

type AuthFormHeaderProps = {
  title: string;
  subtitle: string;
};

export default function AuthFormHeader({
  title,
  subtitle,
}: AuthFormHeaderProps) {
  return (
    <div className="mb-8 text-center">
      <div className="flex justify-center mb-5">
        <EmburLogo size={56} priority className="rounded-2xl" />
      </div>
      <h1 className="text-2xl font-bold text-foreground tracking-tight">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
    </div>
  );
}
