import type { Metadata } from 'next';
import AuthProvider from '@/app/providers/AuthProvider';
import ConnectionProvider from '@/app/providers/ConnectionProvider';
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
          <ConnectionProvider>
            {children}
          </ConnectionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}