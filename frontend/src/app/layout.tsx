import type { Metadata } from 'next';
import AuthProvider from '@/app/components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Auth App',
  description: 'Authentication app with Next.js and Zustand',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}