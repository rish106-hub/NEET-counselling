import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Neetmap | Free personalized guidance",
  description:
    "Enter your NEET score, category, and state to get a free, personalized counselling action plan. Which colleges to apply to, what to register for, and what mistakes to avoid.",
  keywords: ["NEET counselling", "NEET 2026", "MBBS admission", "MCC counselling", "state quota"],
  openGraph: {
    title: "Neetmap",
    description: "Free, accurate, personalized NEET counselling guidance. No paywall.",
    type: "website",
  },
};

const themeScript = `
(() => {
  try {
    const stored = localStorage.getItem("neet-theme") || "system";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (stored === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.dataset.theme = stored;
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
