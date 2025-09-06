'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, Filter, Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import StatsOverview from './shared/StatsOverview';
import TasksManagement from './shared/TasksManagement';

interface Department {
  _id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: { id: string; name: string; code: string } | null;
  supervisor: { id: string; name: string; email: string; role: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
  phone?: string;
  bio?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED';
  dueAt?: string;
  assignedTo: User[]; // Legacy field for backward compatibility
  assignments: Array<{
    userId: string;
    departmentId: string;
    assignedRole: string;
    status: string;
  }>;
  assignedBy: User;
  departmentId?: string;
  requiredDeliverables: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ChairmanDashboard() {
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/all-users', {
        headers: {
          'x-current-user': JSON.stringify({ role: 'PROGRAM_ADMIN', email: 'admin@example.com' })
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?userId=${currentUser?.email}&role=${currentUser?.role}`);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        toast.error('Failed to fetch tasks');
      }
    } catch (error) {
      toast.error('Error fetching tasks');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchDepartments();
    fetchUsers();
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/tasks?userId=${currentUser.email}&role=${currentUser.role}`);
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchData();
  }, [currentUser]);

  return (
    <div className="flex-1  space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Chairman Dashboard</h2>
      </div>

      <StatsOverview
        departments={departments}
        users={users}
        tasks={tasks}
        loading={loading}
      />
      <TasksManagement
        tasks={tasks}
        users={users}
        departments={departments}
        currentUser={currentUser}
        onRefresh={() => {
          fetchDepartments();
          fetchUsers();
          fetchTasks();
        }}
        loading={loading}
      />
    </div>
  );
}