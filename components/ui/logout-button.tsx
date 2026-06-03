"use client";

import { useSession } from "@/contexts/SessionContext";
import { signOutUser } from "@/lib/sign-out";
import { toast } from "@/lib/toast";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@nextui-org/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

type LogoutButtonProps = {
  variant?: "icon" | "full";
  className?: string;
};

export default function LogoutButton({
  variant = "icon",
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const { endSession } = useSession();

  const handleSignOut = async () => {
    try {
      const toastId = toast.loading("Signing you out...");
      await signOutUser(supabase, { endSession });
      toast.success("Signed out successfully", { id: toastId, duration: 3000 });
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  if (variant === "full") {
    return (
      <Button
        color="default"
        variant="bordered"
        startContent={<LogOut size={18} />}
        onPress={handleSignOut}
        className={className ?? "h-11 w-full sm:w-fit font-medium px-6"}
      >
        Sign out
      </Button>
    );
  }

  return (
    <Button isIconOnly color="primary" onPress={handleSignOut}>
      <LogOut />
    </Button>
  );
}
