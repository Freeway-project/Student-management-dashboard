import './globals.css';

import { Analytics } from '@vercel/analytics/react';

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
      <body className="flex min-h-screen w-full flex-col">{children}</body>
      <Analytics />
    </html>
  );
}
