/** Visible input surface on tinted / dark backgrounds (NextUI Input). */
export const EMBUR_INPUT_SURFACE =
  "bg-content1 dark:bg-content2 shadow-sm border border-default-200";

export function emburInputClassNames(overrides?: {
  base?: string;
  input?: string;
  innerWrapper?: string;
  inputWrapper?: string;
}) {
  return {
    base: overrides?.base,
    input: overrides?.input ?? "text-base",
    innerWrapper: overrides?.innerWrapper ?? "h-9",
    inputWrapper: overrides?.inputWrapper ?? EMBUR_INPUT_SURFACE,
  };
}

export function sessionSetInputClassNames(completed?: boolean) {
  return emburInputClassNames({
    base: "w-full transition-all duration-200",
    input: "text-center px-0",
    inputWrapper: completed
      ? "bg-success/20 dark:bg-success/25 border-success/50 shadow-sm"
      : EMBUR_INPUT_SURFACE,
  });
}
