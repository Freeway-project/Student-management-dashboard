'use client';

import { useAuth } from '@/lib/auth-context';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import HeadDashboard from './HeadDashboard';
import QCDashboard from './QCDashboard';
import ViceDeanDashboard from './ViceDeanDashboard';
import DeanDashboard from './DeanDashboard';

export default function RoleDashboard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Please log in to access your dashboard</div>
        </div>
      </div>
    );
  }

  const userRole = user.role;

  switch (userRole) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'HEAD':
      return <HeadDashboard />;
    case 'COLLEGE_QC':
      return <QCDashboard />;
    case 'VICE_DEAN':
      return <ViceDeanDashboard />;
    case 'DEAN':
      return <DeanDashboard />;
    default:
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Unknown role: {userRole}</div>
          </div>
        </div>
      );
  }
}