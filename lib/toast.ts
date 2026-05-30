/**
 * Toast policy:
 * - Show errors and meaningful mutations (create, delete, save, session complete).
 * - Do NOT toast on page load, micro-actions (reorder, set complete), or preference toggles.
 */
import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

/** Set true only for local debugging of UI feedback. */
export const SHOW_DEBUG_TOASTS = false;

export function toastDebug(message: string) {
  if (SHOW_DEBUG_TOASTS) {
    sonnerToast.message(message);
  }
}
