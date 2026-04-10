import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import ToastProvider from "@/components/ToastProvider";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "BudPlug",
  description: "Your Preferred Devil's Lettuce Marketplace",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider />
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}
