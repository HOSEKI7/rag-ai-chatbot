import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contexure — AI Technical Support & Product Knowledge",
  description:
    "Domain-specific RAG Chatbot for industrial equipment technical support and datasheet Q&A.",
  icons: {
    icon: "/contexure.webp",
    apple: "/contexure.webp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased bg-[var(--surface-linen)] text-[var(--color-forest-ink)]">
        {children}
      </body>
    </html>
  );
}
