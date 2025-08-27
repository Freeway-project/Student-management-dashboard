'use client';

import { useAuth } from '@/lib/auth-context';
import AdminDashboard from './AdminDashboard';
import ProgramAdminDashboard from './ProgramAdminDashboard';

import TeacherDashboard from './TeacherDashboard';
import HeadDashboard from './HeadDashboard';
import QCDashboard from './QCDashboard';

import ChairmanDashboard from './ChairmanDashboard';
import ViceChairmanDashboard from './ViceChairmanDashboard';

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
    case 'PROGRAM_ADMIN':
      return <ProgramAdminDashboard />;
    case 'COMPANY_ADMIN':
    case 'ADMIN':
      return <AdminDashboard />;
    case 'CHAIRMAN':
      return <ChairmanDashboard />;
    case 'VICE_CHAIRMAN':
      return <ViceChairmanDashboard />;
    case 'HOD':
    case 'HEAD':
      return <HeadDashboard />;
    case 'COORDINATOR':
    case 'COLLEGE_QC':
      return <QCDashboard />;
    case 'PROFESSOR':
    case 'TEACHER':
      return <TeacherDashboard />;
    
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