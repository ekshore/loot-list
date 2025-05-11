import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { ThemeProvider } from "~/components/theme-provider";
import { SessionProvider } from "next-auth/react";
import { Header } from "~/app/_components/header";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "Loot List",
  description: "A place to keep lists of desired loot",
  icons: [{ rel: "icon", url: "/images/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider>
              <Header />
              <main className="container m-auto min-h-screen border-x border-x-border">
                {children}
              </main>
              <Toaster />
            </SessionProvider>
          </ThemeProvider>
      </body>
    </html>
  );
}
