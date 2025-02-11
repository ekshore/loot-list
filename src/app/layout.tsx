import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/theme-provider";
import { Header } from "~/app/_components/header";

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
        <TRPCReactProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            <main className="container m-auto min-h-screen border-x border-x-border">
                {children}
            </main>
          </ThemeProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
