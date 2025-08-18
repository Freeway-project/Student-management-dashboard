'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect authenticated users to dashboard  
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">School Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            School Management
            <span className="text-blue-600"> Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive platform for students, teachers, and administrators to manage academic activities efficiently.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="lg" variant="outline" className="px-8">
                Student Registration
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Multi-Role Access</CardTitle>
              <CardDescription>
                Different dashboards for students, teachers, heads, QC staff, vice deans, and deans.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <BookOpen className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Academic Management</CardTitle>
              <CardDescription>
                Manage courses, assignments, grades, and academic progress all in one place.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Calendar className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Organized Workflow</CardTitle>
              <CardDescription>
                Hierarchical approval system with role-based access to data and functions.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* User Types */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Built for Every Role</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Students</h3>
              <p className="text-gray-600">Self-registration, profile management, and academic tracking.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Teachers</h3>
              <p className="text-gray-600">Student management, grade submission, and class oversight.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Administrators</h3>
              <p className="text-gray-600">User creation, role assignment, and system management.</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Leadership</h3>
              <p className="text-gray-600">Strategic oversight, approvals, and institutional metrics.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>© 2024 School Dashboard. Built for educational excellence.</p>
        </div>
      </footer>
    </div>
  );
}