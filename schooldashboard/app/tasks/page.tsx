'use client';

import { useState, useEffect } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  CheckSquare,
  Plus,
  Filter,
  Calendar,
  User,
  Building,
  Clock,
  X
} from 'lucide-react';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskList from '@/components/tasks/TaskList';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import { useAuth } from '@/lib/auth-context';

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
}

interface Task {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED';
  dueAt?: string;
  assignedTo: User[];
  assignedBy: User;
  departmentId?: string;
  requiredDeliverables: any[];
  createdAt: string;
  updatedAt: string;
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Create task states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: '',
    assignedTo: [] as string[],
    departments: [] as string[],
    requiredDeliverables: [
      {

        type: 'PDF',
        label: '',
        optional: false
      }
    ]
  });

  console.log('🚀 ~ :78 ~ TaskManagement ~ newTask::==', newTask)

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filter users based on selected departments
    if (selectedDepartments.length === 0) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.department && selectedDepartments.includes(user.department.id)
      );
      setFilteredUsers(filtered);
    }
  }, [selectedDepartments, users]);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setCurrentUser({
        ...user,
        department: user.department || null, // Ensure department is null if undefined
      });
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch departments
      const deptResponse = await fetch('/api/departments');
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData);
      }

      // Fetch users
      const userResponse = await fetch('/api/users/all-users', {
        headers: {
          'x-current-user': JSON.stringify({ role: 'PROGRAM_ADMIN', email: 'admin@example.com' })
        }
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUsers(userData.users);
        setFilteredUsers(userData.users);
      }

      // Fetch tasks based on current user role
      const tasksResponse = await fetch(`/api/tasks?userId=${currentUser?.id}&role=${currentUser?.role}`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = (departmentId: string) => {
    setSelectedDepartments(prev =>
      prev.includes(departmentId)
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleUserSelect = (userId: string) => {
    setNewTask(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter(id => id !== userId)
        : [...prev.assignedTo, userId]
    }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setCreating(true);

    try {
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        instructions: newTask.description, // Using description as instructions for now
        priority: newTask.priority,
        dueAt: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
        assignedTo: newTask.assignedTo,
        assignedBy: currentUser.id,
        departmentId: selectedDepartments.length > 0 ? selectedDepartments[0] : currentUser.department?.id,
        requiredDeliverables: newTask.requiredDeliverables
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Task created successfully:', result);

        setNewTask({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: '',
          assignedTo: [],
          departments: [],
          requiredDeliverables: [
            {
              type: 'PDF',
              label: '',
              optional: false
            }
          ]
        });
        setSelectedDepartments([]);

        // Refresh tasks
        fetchData();
      } else {
        const error = await response.json();
        console.error('Failed to create task:', error);
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesSearch = !searchTerm ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading task management...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CheckSquare className="h-8 w-8" />
          Task Management
        </h2>
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className={`grid w-full ${currentUser?.role === 'PROFESSOR' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          {currentUser?.role !== 'PROFESSOR' && (
            <TabsTrigger value="create">Create Task</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <TaskFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          {/* Task List */}
          <TaskList
            tasks={filteredTasks}
            departments={departments}
            getPriorityColor={getPriorityColor}
            getStatusColor={getStatusColor}
          />
        </TabsContent>

        {currentUser?.role !== 'PROFESSOR' && (
          <TabsContent value="create" className="space-y-4">
            <CreateTaskForm
              newTask={newTask}
              setNewTask={setNewTask}
              selectedDepartments={selectedDepartments}
              setSelectedDepartments={setSelectedDepartments}
              filteredUsers={filteredUsers}
              handleUserSelect={handleUserSelect}
              handleCreateTask={handleCreateTask}
              creating={creating}
              departments={departments}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}