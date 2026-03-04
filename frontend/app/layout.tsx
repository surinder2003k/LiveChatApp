import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { IntroLoader } from "@/components/intro-loader";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ChatApp",
  description: "Real-time chat with a premium UI"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      afterSignInUrl="/chat"
      afterSignUpUrl="/chat"
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorTextOnPrimaryBackground: "white",
        },
        elements: {
          socialButtonsBlockButtonText: "text-white font-medium",
          socialButtonsBlockButton: "glass border-primary/20 hover:bg-primary/10",
        }
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} font-sans antialiased text-foreground bg-background`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <NextTopLoader color="hsl(var(--primary))" showSpinner={false} height={2} shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))" />
            <Toaster position="top-right" richColors closeButton theme="dark" />
            <IntroLoader />
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
