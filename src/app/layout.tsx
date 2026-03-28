import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import SupabaseProvider from '@/components/providers/SupabaseProvider';
import './globals.css';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Yearworm',
  description: 'Guess the song, build the timeline',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Yearworm',
  },
  applicationName: 'Yearworm',
};

export const viewport: Viewport = {
  themeColor: '#0a0e1a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="bg-[#0a0e1a] text-white min-h-screen">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
