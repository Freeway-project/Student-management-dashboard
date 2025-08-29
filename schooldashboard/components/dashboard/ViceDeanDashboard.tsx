'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, Users, FileText, TrendingUp, CheckSquare, Plus } from 'lucide-react';
import { toast } from 'sonner';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskList from '@/components/tasks/TaskList';
import TaskDetail from '@/components/tasks/TaskDetail';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import DepartmentForm from './DepartmentForm';
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
  assignedTo: User[];
  assignedBy: User;
  departmentId?: string;
  requiredDeliverables: any[];
  createdAt: string;
  updatedAt: string;
}

export default function ViceDeanDashboard() {
  const { user: currentUser } = useAuth();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  // Task filter states
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  // Task detail view
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Task creation states
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
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users/all-users', {
        headers: {
          'x-current-user': JSON.stringify({ role: 'VICE_CHAIRMAN', email: 'vicechairman@example.com' })
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
    }
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const currentUser = { role: 'VICE_CHAIRMAN', email: 'vicechairman@example.com' };
      const response = await fetch(`/api/tasks?userId=${currentUser.email}&role=${currentUser.role}`);
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        toast.error('Failed to fetch tasks');
      }
    } catch (error) {
      toast.error('Error fetching tasks');
    } finally {
      setTasksLoading(false);
    }
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
    setCreatingTask(true);

    try {
      if (!currentUser) {
        toast.error('You must be logged in to create a task');
        setCreatingTask(false);
        return;
      }

      const taskData = {
        title: newTask.title,
        description: newTask.description,
        instructions: newTask.description,
        priority: newTask.priority,
        dueAt: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
        assignedTo: newTask.assignedTo,
        assignedBy: currentUser.id,
        departmentId: selectedDepartments.length > 0 ? selectedDepartments[0] : undefined,
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
        toast.success('Task created successfully!');
        fetchTasks();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create task');
      }
    } catch (error) {
      toast.error('Error creating task');
    } finally {
      setCreatingTask(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
    fetchTasks();
  }, []);

  useEffect(() => {
    // Filter users based on selected departments for task assignment
    if (selectedDepartments.length === 0) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.department && selectedDepartments.includes(user.department.id)
      );
      setFilteredUsers(filtered);
    }
  }, [selectedDepartments, users]);

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
    const matchesStatus = !taskStatusFilter || task.status === taskStatusFilter;
    const matchesPriority = !taskPriorityFilter || task.priority === taskPriorityFilter;
    const matchesSearch = !taskSearchTerm ||
      task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(taskSearchTerm.toLowerCase());

    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Vice Dean Dashboard</h2>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="create-task">Create Task</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Under supervision
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Total staff
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Decisions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">College Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">91%</div>
            <p className="text-xs text-muted-foreground">
              Overall rating
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Administrative Tasks</CardTitle>
            <CardDescription>
              High-priority items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Budget Approval Request</p>
                  <p className="text-xs text-muted-foreground">Engineering Department</p>
                </div>
                <div className="text-xs text-muted-foreground">Urgent</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Faculty Promotion Review</p>
                  <p className="text-xs text-muted-foreground">Dr. Johnson</p>
                </div>
                <div className="text-xs text-muted-foreground">This week</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>College Statistics</CardTitle>
            <CardDescription>
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Faculty Retention</p>
                  <p className="text-xs text-muted-foreground">This year</p>
                </div>
                <div className="text-sm font-bold">96%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <DepartmentForm />
      </div>
        </TabsContent>

        <TabsContent value="all-tasks" className="space-y-4">
          {selectedTaskId ? (
            <TaskDetail
              taskId={selectedTaskId}
              onBack={() => setSelectedTaskId(null)}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  All Tasks
                </h3>
                <Button onClick={fetchTasks} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              <TaskFilters
                statusFilter={taskStatusFilter}
                setStatusFilter={setTaskStatusFilter}
                priorityFilter={taskPriorityFilter}
                setPriorityFilter={setTaskPriorityFilter}
                searchTerm={taskSearchTerm}
                setSearchTerm={setTaskSearchTerm}
              />

              {tasksLoading ? (
                <div className="text-center py-8">Loading tasks...</div>
              ) : (
                <TaskList
                  tasks={filteredTasks}
                  departments={departments}
                  getPriorityColor={getPriorityColor}
                  getStatusColor={getStatusColor}
                  onTaskClick={setSelectedTaskId}
                />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="create-task" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Task
            </h3>
          </div>

          <CreateTaskForm
            newTask={newTask}
            setNewTask={setNewTask}
            selectedDepartments={selectedDepartments}
            setSelectedDepartments={setSelectedDepartments}
            filteredUsers={filteredUsers}
            handleUserSelect={handleUserSelect}
            handleCreateTask={handleCreateTask}
            creating={creatingTask}
            departments={departments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}