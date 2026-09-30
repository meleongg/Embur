"use client";

import { Button } from "@nextui-org/react";
import { Settings } from "lucide-react";
import { useRouter } from "next/navigation";
export default function PageTitle({
  title,
  className = "mb-2",
  showSettingsButton = true,
}: {
  title: string;
  className?: string;
  showSettingsButton?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      className={`flex w-full min-w-0 items-center justify-between gap-3 ${className}`}
    >
      <h1 className="min-w-0 truncate text-2xl font-bold">{title}</h1>
      {showSettingsButton && (
        <div className="flex shrink-0 gap-2">
          <Button
            isIconOnly
            color="primary"
            aria-label="Account settings"
            onPress={() => router.push("/protected/settings")}
          >
            <Settings />
          </Button>
        </div>
      )}
    </div>
  );
}
