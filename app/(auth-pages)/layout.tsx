import MarketingNav from "@/components/marketing-nav";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background w-full">
      <MarketingNav />
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6 w-full">
        {children}
      </div>
    </div>
  );
}
