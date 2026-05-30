import { AppToaster } from "@/components/app-toaster";
import { QueryProvider } from "@/components/query-provider";
import { ConditionalThemeProvider } from "@/components/conditional-theme-provider";
import { SessionProvider } from "@/contexts/SessionContext";
import { NextUIProvider } from "@nextui-org/react";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#18181B",
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "FitFlash - Fitness Tracking App",
  description:
    "Track your workouts and fitness progress with a simple, intuitive interface",
  manifest: "/manifest.json",
  keywords: [
    "fitness app",
    "workout tracker",
    "strength training",
    "exercise log",
    "gym progress",
    "fitness goals",
  ],
  applicationName: "FitFlash",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: defaultUrl,
    title: "FitFlash - Your Personal Fitness Journey",
    description:
      "Track workouts, set goals, and visualize your fitness progress over time",
    siteName: "FitFlash",
    images: [
      {
        url: "/images/FitFlash-og-image.png",
        width: 1200,
        height: 630,
        alt: "FitFlash App Dashboard",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "FitFlash - Fitness Tracking Made Simple",
    description: "Easily track workouts and monitor your fitness journey",
    images: ["/images/FitFlash-twitter-image.png"],
  },

  authors: [{ name: "Melvin Teo" }],
  creator: "Melvin Teo",
  publisher: "FitFlash",
  category: "Fitness & Health",

  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitFlash",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png" }],
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
