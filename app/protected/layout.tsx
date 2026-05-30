import AppShell from "@/components/app-shell";
import ThemeSync from "@/components/theme-sync";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeSync />
      <AppShell>{children}</AppShell>
    </>
  );
}
