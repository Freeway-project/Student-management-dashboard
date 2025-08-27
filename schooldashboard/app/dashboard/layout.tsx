import Link from 'next/link';
import {
  Home,
  GraduationCap,
  CheckSquare
} from 'lucide-react';

import { Analytics } from '@vercel/analytics/react';
import { User } from './user';
import Providers from './providers';
import RoleSwapper from '@/components/RoleSwapper';

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
        <main className="flex min-h-screen w-full flex-col bg-muted/40">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 justify-between">
            <HeaderNav />
            <User />
          </header>
          <main className="flex-1 p-4 sm:px-6 sm:py-4">
            {children}
          </main>
          <Analytics />
          <RoleSwapper />
        </main>
    </Providers>
  );
}

function HeaderNav() {
  return (
    <div className="flex items-center gap-6">
      <Link
        href="/"
        className="group flex items-center gap-2 text-lg font-semibold"
      >
        <GraduationCap className="h-6 w-6 transition-all group-hover:scale-110" />
        <span className="hidden sm:block">School Dashboard</span>
      </Link>
      
      <nav className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:block">Dashboard</span>
        </Link>
        
        <Link
          href="/tasks"
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <CheckSquare className="h-4 w-4" />
          <span className="hidden sm:block">Tasks</span>
        </Link>
      </nav>
    </div>
  );
}


