import { AppToaster } from "@/components/app-toaster";
import { ConditionalThemeProvider } from "@/components/conditional-theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { SessionProvider } from "@/contexts/SessionContext";
import { NextUIProvider } from "@nextui-org/react";
import { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const EMBUR_DESCRIPTION =
  "Embur — a calm strength training log for consistent progress.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#18181B",
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Embur — Strength Training Log",
  description: EMBUR_DESCRIPTION,
  manifest: "/manifest.json",
  keywords: [
    "strength training",
    "workout log",
    "workout tracker",
    "exercise log",
    "gym progress",
    "personal records",
  ],
  applicationName: "Embur",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: defaultUrl,
    title: "Embur — Strength Training Log",
    description: EMBUR_DESCRIPTION,
    siteName: "Embur",
  },

  twitter: {
    card: "summary_large_image",
    title: "Embur — Strength Training Log",
    description: EMBUR_DESCRIPTION,
  },

  authors: [{ name: "Melvin Teo" }],
  creator: "Melvin Teo",
  publisher: "Embur",
  category: "Fitness & Health",

  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Embur",
  },
  icons: {
    icon: [
      {
        url: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [{ url: "/web-app-manifest-192x192.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-title" content="Embur" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ConditionalThemeProvider>
          <QueryProvider>
            <NextUIProvider>
              <SessionProvider>
                <main className="min-h-screen flex flex-col">{children}</main>
              </SessionProvider>
              <AppToaster />
            </NextUIProvider>
          </QueryProvider>
        </ConditionalThemeProvider>
      </body>
    </html>
  );
}
