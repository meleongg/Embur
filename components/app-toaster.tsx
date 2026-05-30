"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand={false}
      visibleToasts={2}
      duration={3500}
    />
  );
}
