import "../lib/orpc/client.server"; // for pre-rendering ORPC client

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import TanstackQueryProvider from "@/lib/tanstack-query/provider";
import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s — Trackr",
    default: "Trackr — work charted from backlog to done",
  },
  description:
    "Trackr charts every issue, owner and status in one workspace so your team can see what is moving and what is waiting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${archivo.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextTopLoader color="#C0327B" showSpinner={false} height={2} />

          <TanstackQueryProvider>
            <main className="min-h-dvh">{children}</main>

            <Toaster position="top-right" richColors closeButton />
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
