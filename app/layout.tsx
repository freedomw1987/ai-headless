import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ai-headless',
  description: 'AI Headless CRUD Framework',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
