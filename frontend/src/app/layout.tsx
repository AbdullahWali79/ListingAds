import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ListingAds - Classified Ads Platform',
  description: 'Buy and sell anything on ListingAds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

