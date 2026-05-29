import MarketingNav from "@/components/marketing-nav";
import Link from "next/link";

export default function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <MarketingNav />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:py-10">
        <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl mb-6 tracking-tight">
          {title}
        </h1>
        <div className="bg-card p-6 sm:p-8 rounded-xl border border-border/60 shadow-sm">
          <div className="max-w-none text-foreground [&_h2]:text-foreground [&_h3]:text-foreground [&_p]:text-muted-foreground [&_li]:text-muted-foreground">
            {children}
          </div>
          <div className="mt-8 pt-6 border-t border-border">
            <Link href="/" className="text-primary font-medium hover:underline">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
