export type Message =
  | { success: string }
  | { error: string }
  | { message: string };

export function FormMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-md text-sm">
      {"success" in message && (
        <div className="alert-success">{message.success}</div>
      )}
      {"error" in message && (
        <div className="alert-error">{message.error}</div>
      )}
      {"message" in message && (
        <div className="alert-info">{message.message}</div>
      )}
    </div>
  );
}
