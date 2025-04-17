import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'GreenThickss',
  description: 'GreenThickss Frontend',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}