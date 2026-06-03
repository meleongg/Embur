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
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
      <h1 className={`text-2xl font-bold ${className}`}>{title}</h1>
      {showSettingsButton && (
        <div className="flex gap-2 self-end sm:self-auto">
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
