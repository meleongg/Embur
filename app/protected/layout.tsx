import ThemeSync from "@/components/theme-sync";
import Navbar from "@/components/ui/navbar";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col pb-24 bg-background text-foreground">
      <ThemeSync />
      <div className="w-full flex flex-col flex-1 gap-6 py-8 px-8">{children}</div>
      <Navbar />
    </div>
  );
}
