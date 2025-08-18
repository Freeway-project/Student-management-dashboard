import './globals.css';

import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'School Dashboard',
  description:
    'Multi-role school management dashboard for students, teachers, and administrators.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen w-full flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
