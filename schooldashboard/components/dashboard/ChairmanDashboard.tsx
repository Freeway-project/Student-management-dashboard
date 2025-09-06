'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, Users, AlertCircle, Filter, UserPlus, CheckSquare, Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskList from '@/components/tasks/TaskList';
import TaskDetail from '@/components/tasks/TaskDetail';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
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
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Task filter states
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  // Task detail view
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailContext, setUserDetailContext] = useState<'users' | 'department' | null>(null);
  
  // Edit user states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: '',
    departmentId: '',
    departmentRoles: [] as Array<{ departmentId: string; roles: string[] }>
  });

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    departmentId: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Task creation states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: '',
    assignments: [] as Array<{
      userId: string;
      departmentId: string;
      assignedRole: string;
      userName: string;
      departmentName: string;
      departmentCode: string;
    }>,
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
        setDepartments(data.departments || []);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/users/all-users?${params}`, {
        headers: {
          'x-current-user': JSON.stringify({ role: 'PROGRAM_ADMIN', email: 'admin@example.com' })
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
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchTasks = async () => {
    setTasksLoading(true);
    try {
      const currentUser = { role: 'CHAIRMAN', email: 'chairman@example.com' };
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

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDepartment)
      });
      
      if (response.ok) {
        const createdDept = await response.json();
        setDepartments([...departments, createdDept]);
        setNewDepartment({ name: '', code: '', description: '' });
        toast.success(`Department "${createdDept.name}" created successfully!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create department');
      }
    } catch (error) {
      toast.error('Error creating department');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-current-user': JSON.stringify({ role: 'PROGRAM_ADMIN', email: 'admin@example.com' })
        },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        const createdUser = await response.json();
        setUsers([...users, createdUser]);
        setNewUser({ name: '', email: '', password: '', role: '', departmentId: '' });
        toast.success(`User "${createdUser.name}" created successfully!`);
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Error creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully!');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    const userWithRoles = user as any;
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.department?.id || '',
      departmentRoles: userWithRoles.departmentRoles || [] // Load existing department roles
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setUpdatingUser(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-current-user': JSON.stringify({ role: 'CHAIRMAN', email: 'chairman@example.com' })
        },
        body: JSON.stringify({
          name: editUserData.name,
          email: editUserData.email,
          role: editUserData.role,
          departmentId: editUserData.departmentId,
          departmentRoles: editUserData.departmentRoles.filter(dr => dr.roles.length > 0)
        })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
        setEditingUser(null);
        setEditUserData({ name: '', email: '', role: '', departmentId: '', departmentRoles: [] });
        toast.success(`User "${updatedUser.name}" updated successfully!`);
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    } finally {
      setUpdatingUser(false);
    }
  };

  const addDepartmentRole = () => {
    setEditUserData({
      ...editUserData,
      departmentRoles: [...editUserData.departmentRoles, { departmentId: '', roles: [] }]
    });
  };

  const removeDepartmentRole = (index: number) => {
    setEditUserData({
      ...editUserData,
      departmentRoles: editUserData.departmentRoles.filter((_, i) => i !== index)
    });
  };

  const updateDepartmentRole = (index: number, field: 'departmentId' | 'roles', value: any) => {
    const updated = [...editUserData.departmentRoles];
    if (field === 'roles') {
      // Handle role toggle
      const role = value;
      const currentRoles = updated[index].roles;
      if (currentRoles.includes(role)) {
        updated[index].roles = currentRoles.filter(r => r !== role);
      } else {
        updated[index].roles = [...currentRoles, role];
      }
    } else {
      updated[index][field] = value;
    }
    setEditUserData({ ...editUserData, departmentRoles: updated });
  };

  const handleUserSelect = (userId: string) => {
    // No-op: User selection is now handled directly in CreateTaskForm component
    // through the assignments array structure
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
        assignments: newTask.assignments.map(assignment => ({
          userId: assignment.userId,
          departmentId: assignment.departmentId,
          assignedRole: assignment.assignedRole
        })),
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
          assignments: [],
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
      console.error('Error creating task:', error);
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
    fetchUsers();
  }, [roleFilter, searchTerm]);

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

  const filteredUsersForUserManagement = users.filter(user => {
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesSearch = !searchTerm || user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || (user.department && user.department.id === departmentFilter);
    
    return matchesRole && matchesSearch && matchesDepartment;
  });

  const getDepartmentUsers = (departmentId: string) => {
    return users.filter(user => user.department && user.department.id === departmentId);
  };

  const getDepartmentTasks = (departmentId: string) => {
    return tasks.filter(task => task.departmentId === departmentId);
  };

  const getDepartmentDetails = (departmentId: string) => {
    const dept = Array.isArray(departments) ? departments.find(d => d._id === departmentId) : null;
    if (!dept) return null;
    
    const deptUsers = getDepartmentUsers(departmentId);
    const deptTasks = getDepartmentTasks(departmentId);
    
    return {
      ...dept,
      users: deptUsers,
      tasks: deptTasks,
      stats: {
        totalUsers: deptUsers.length,
        totalTasks: deptTasks.length,
        hods: deptUsers.filter(u => u.role === 'HOD').length,
        coordinators: deptUsers.filter(u => u.role === 'COORDINATOR').length,
        professors: deptUsers.filter(u => u.role === 'PROFESSOR').length,
        activeTasks: deptTasks.filter(t => t.status !== 'SUBMITTED').length,
        completedTasks: deptTasks.filter(t => t.status === 'SUBMITTED').length
      }
    };
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

  const getUserDetails = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    // Get tasks assigned to this user (check both legacy and new assignment formats)
    const userTasks = tasks.filter(task => {
      // Check legacy assignedTo field
      const legacyAssigned = task.assignedTo?.some(assignee => assignee.id === userId);
      // Check new assignments array
      const newAssigned = task.assignments?.some(assignment => assignment.userId === userId);
      return legacyAssigned || newAssigned;
    });

    // Get user's departments (both primary and additional)
    const userDepartments: any[] = [];
    
    // Add primary department
    if (user.department) {
      userDepartments.push({
        ...user.department,
        roles: [user.role],
        isPrimary: true
      });
    }

    // Add additional departments from departmentRoles if available
    const userWithRoles = user as any;
    if (userWithRoles.departmentRoles) {
      userWithRoles.departmentRoles.forEach((deptRole: any) => {
        const dept = Array.isArray(departments) ? departments.find(d => d._id === deptRole.departmentId) : null;
        if (dept && !userDepartments.some(ud => ud.id === dept._id)) {
          userDepartments.push({
            id: dept._id,
            name: dept.name,
            code: dept.code,
            roles: deptRole.roles,
            isPrimary: false
          });
        }
      });
    }

    // GROUP TASKS BY DEPARTMENT
    const tasksByDepartment = userDepartments.map(dept => ({
      ...dept,
      tasks: userTasks.filter(task =>
        // Match tasks assigned to user in this specific department
        task.assignments?.some(assignment =>
          assignment.userId === userId &&
          assignment.departmentId === dept.id
        ) ||
        // Fallback: legacy assignedTo + department match
        (task.assignedTo?.some(assignee => assignee.id === userId) &&
         task.departmentId === dept.id)
      ),
      taskStats: {
        total: 0, // Will be calculated below
        active: 0,
        completed: 0
      }
    }));

    // Calculate task stats for each department
    tasksByDepartment.forEach(dept => {
      dept.taskStats.total = dept.tasks.length;
      dept.taskStats.active = dept.tasks.filter((t: Task) => t.status !== 'SUBMITTED').length;
      dept.taskStats.completed = dept.tasks.filter((t: Task) => t.status === 'SUBMITTED').length;
    });

    return {
      ...user,
      tasks: userTasks,
      departments: userDepartments,
      tasksByDepartment,
      stats: {
        totalTasks: userTasks.length,
        activeTasks: userTasks.filter(t => t.status !== 'SUBMITTED').length,
        completedTasks: userTasks.filter(t => t.status === 'SUBMITTED').length,
        urgentTasks: userTasks.filter(t => t.priority === 'URGENT').length,
        totalDepartments: userDepartments.length
      }
    };
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
    <div className="flex-1  space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Chairman Dashboard</h2>
      </div>



      {notification && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="h-4 w-4" />
          {notification.message}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="create-department">Create Department</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="create-user">Create User</TabsTrigger>
          <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="create-task">Create Task</TabsTrigger>
          {currentUser?.role === 'VICE_CHAIRMAN' && (
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <StatsOverview 
            departments={departments}
            users={users}
            tasks={tasks}
            loading={loading || usersLoading || tasksLoading}
          />
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          {selectedUserId ? (
            <>
              {/* User Detail View (from Department) */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => {
                  setSelectedUserId(null);
                  setUserDetailContext(null);
                }} className="text-blue-600">
                  ← Back to Department
                </Button>
                <Button onClick={() => {fetchUsers(); fetchTasks();}} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {(() => {
                const userDetails = getUserDetails(selectedUserId);
                if (!userDetails) return <div>User not found</div>;

                return (
                  <div className="space-y-6">
                    {/* User Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <User className="h-6 w-6" />
                          {userDetails.name}
                        </CardTitle>
                        <CardDescription className="text-lg">
                          {userDetails.role} • {userDetails.email}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{userDetails.stats.totalTasks}</div>
                            <div className="text-sm text-muted-foreground">Total Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{userDetails.stats.activeTasks}</div>
                            <div className="text-sm text-muted-foreground">Active Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{userDetails.stats.completedTasks}</div>
                            <div className="text-sm text-muted-foreground">Completed Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{userDetails.stats.totalDepartments}</div>
                            <div className="text-sm text-muted-foreground">Departments</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* User Detail Tabs */}
                    <Tabs defaultValue="overview" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="departments">Departments</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div><strong>Name:</strong> {userDetails.name}</div>
                              <div><strong>Email:</strong> {userDetails.email}</div>
                              <div><strong>Role:</strong> {userDetails.role}</div>
                              {userDetails.phone && <div><strong>Phone:</strong> {userDetails.phone}</div>}
                              {userDetails.bio && <div><strong>Bio:</strong> {userDetails.bio}</div>}
                              <div><strong>Joined:</strong> {new Date(userDetails.createdAt).toLocaleDateString()}</div>
                              {userDetails.lastLoginAt && (
                                <div><strong>Last Login:</strong> {new Date(userDetails.lastLoginAt).toLocaleDateString()}</div>
                              )}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle>Task Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>Total Tasks:</span>
                                <span className="font-medium">{userDetails.stats.totalTasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Active Tasks:</span>
                                <span className="font-medium text-orange-600">{userDetails.stats.activeTasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Completed Tasks:</span>
                                <span className="font-medium text-green-600">{userDetails.stats.completedTasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Urgent Tasks:</span>
                                <span className="font-medium text-red-600">{userDetails.stats.urgentTasks}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="departments" className="space-y-4">
                        <div className="grid gap-4">
                          {userDetails.tasksByDepartment.map((dept: any) => (
                            <Card key={dept.id}>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  {dept.name} ({dept.code})
                                  {dept.isPrimary && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
                                  )}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div><strong>Roles:</strong> {dept.roles.join(', ')}</div>
                                  <div>
                                    <strong>Department Tasks:</strong> {dept.tasks.length}
                                    {dept.tasks.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {dept.tasks.slice(0, 3).map((task: any) => (
                                          <div key={task._id} className="text-sm text-muted-foreground">
                                            • {task.title} ({task.status})
                                          </div>
                                        ))}
                                        {dept.tasks.length > 3 && (
                                          <div className="text-sm text-muted-foreground">
                                            ... and {dept.tasks.length - 3} more
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="tasks" className="space-y-4">
                        <div className="grid gap-4">
                          {userDetails.tasks.length === 0 ? (
                            <Card>
                              <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">No tasks assigned to this user</p>
                              </CardContent>
                            </Card>
                          ) : (
                            userDetails.tasks.map((task: any) => (
                              <Card key={task._id}>
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">{task.title}</h4>
                                      <p className="text-sm text-muted-foreground">{task.description}</p>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                                          {task.priority}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                                          {task.status}
                                        </span>
                                      </div>
                                      {task.dueAt && (
                                        <p className="text-xs text-muted-foreground">
                                          Due: {new Date(task.dueAt).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedTaskId(task._id)}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                );
              })()}
            </>
          ) : selectedDepartmentId ? (
            <>
              {/* Department Detail View */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setSelectedDepartmentId(null)} className="text-blue-600">
                  ← Back to All Departments
                </Button>
                <Button onClick={() => {fetchDepartments(); fetchUsers(); fetchTasks();}} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {(() => {
                const deptDetails = getDepartmentDetails(selectedDepartmentId);
                if (!deptDetails) return <div>Department not found</div>;

                return (
                  <div className="space-y-6">
                    {/* Department Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{deptDetails.name}</CardTitle>
                        <CardDescription className="text-lg">
                          Code: {deptDetails.code} • {deptDetails.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{deptDetails.stats.totalUsers}</div>
                            <div className="text-sm text-muted-foreground">Total Users</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{deptDetails.stats.totalTasks}</div>
                            <div className="text-sm text-muted-foreground">Total Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{deptDetails.stats.activeTasks}</div>
                            <div className="text-sm text-muted-foreground">Active Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{deptDetails.stats.completedTasks}</div>
                            <div className="text-sm text-muted-foreground">Completed</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Users and Tasks Tabs */}
                    <Tabs defaultValue="users" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="users">Department Users ({deptDetails.stats.totalUsers})</TabsTrigger>
                        <TabsTrigger value="tasks">Department Tasks ({deptDetails.stats.totalTasks})</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      </TabsList>

                      <TabsContent value="users" className="space-y-4">
                        <div className="grid gap-4">
                          {deptDetails.users.map((user) => (
                            <Card 
                              key={user.id} 
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setUserDetailContext('department');
                              }}
                            >
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">{user.name}</h4>
                                      <span className={`px-2 py-1 text-xs rounded ${
                                        user.role === 'HOD' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                                        user.role === 'COORDINATOR' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {user.role}
                                      </span>
                                      {(user as any).departmentRoles && (user as any).departmentRoles.length > 0 && (
                                        <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                                          Multi
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    {user.phone && <p className="text-sm text-muted-foreground">Phone: {user.phone}</p>}
                                    {user.lastLoginAt && (
                                      <p className="text-xs text-muted-foreground">
                                        Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-xs text-blue-600">
                                    Click to view details →
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="tasks" className="space-y-4">
                        <div className="grid gap-4">
                          {deptDetails.tasks.map((task) => (
                            <Card key={task._id} className="cursor-pointer hover:bg-gray-50" 
                                  onClick={() => setSelectedTaskId(task._id)}>
                              <CardContent className="pt-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">{task.title}</h4>
                                    <div className="flex gap-2">
                                      <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                      </span>
                                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                                        {task.status}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Assigned to: {(task.assignments?.length || task.assignedTo?.length || 0)} assignment{(task.assignments?.length || task.assignedTo?.length || 0) !== 1 ? 's' : ''}</span>
                                    {task.dueAt && <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="analytics" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">User Distribution</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span>HODs</span>
                                <span className="font-semibold">{deptDetails.stats.hods}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Coordinators</span>
                                <span className="font-semibold">{deptDetails.stats.coordinators}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Professors</span>
                                <span className="font-semibold">{deptDetails.stats.professors}</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Task Status</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span>Active Tasks</span>
                                <span className="font-semibold text-orange-600">{deptDetails.stats.activeTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Completed Tasks</span>
                                <span className="font-semibold text-green-600">{deptDetails.stats.completedTasks}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Completion Rate</span>
                                <span className="font-semibold">
                                  {deptDetails.stats.totalTasks > 0 
                                    ? Math.round((deptDetails.stats.completedTasks / deptDetails.stats.totalTasks) * 100) 
                                    : 0}%
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              {/* Department List View */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">All Departments</h3>
                <Button onClick={fetchDepartments} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading departments...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.isArray(departments) && departments.map((dept) => {
                    const deptUsers = getDepartmentUsers(dept._id);
                    const deptTasks = getDepartmentTasks(dept._id);
                    return (
                      <Card key={dept._id} 
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setSelectedDepartmentId(dept._id)}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {dept.name}
                            <span className="text-sm font-normal text-muted-foreground">({dept.code})</span>
                          </CardTitle>
                          {dept.description && (
                            <CardDescription>{dept.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span>Users: <strong>{deptUsers.length}</strong></span>
                              <span>Tasks: <strong>{deptTasks.length}</strong></span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(dept.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className={`inline-block px-2 py-1 text-xs rounded ${
                                dept.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {dept.isActive ? 'Active' : 'Inactive'}
                              </div>
                              <span className="text-xs text-blue-600">Click to view details →</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }) || <div className="text-center py-8">No departments available.</div>}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="create-department" className="space-y-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Create New Department</CardTitle>
              <CardDescription>
                Add a new department to the institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Department Name *</label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Department Code *</label>
                  <input
                    type="text"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="e.g., CSE, EEE"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>

           

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Department'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {selectedUserId ? (
            <>
              {/* User Detail View */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => {
                  setSelectedUserId(null);
                  setUserDetailContext(null);
                }} className="text-blue-600">
                  ← Back to All Users
                </Button>
                <Button onClick={() => {fetchUsers(); fetchTasks();}} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {(() => {
                const userDetails = getUserDetails(selectedUserId);
                if (!userDetails) return <div>User not found</div>;

                return (
                  <div className="space-y-6">
                    {/* User Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <User className="h-6 w-6" />
                          {userDetails.name}
                        </CardTitle>
                        <CardDescription className="text-lg">
                          {userDetails.role} • {userDetails.email}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{userDetails.stats.totalTasks}</div>
                            <div className="text-sm text-muted-foreground">Total Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{userDetails.stats.activeTasks}</div>
                            <div className="text-sm text-muted-foreground">Active Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{userDetails.stats.completedTasks}</div>
                            <div className="text-sm text-muted-foreground">Completed Tasks</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{userDetails.stats.totalDepartments}</div>
                            <div className="text-sm text-muted-foreground">Departments</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* User Detail Tabs */}
                    <Tabs defaultValue="overview" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="departments">Departments</TabsTrigger>
                        <TabsTrigger value="tasks">Tasks</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div><strong>Name:</strong> {userDetails.name}</div>
                              <div><strong>Email:</strong> {userDetails.email}</div>
                              <div><strong>Role:</strong> {userDetails.role}</div>
                              {userDetails.phone && <div><strong>Phone:</strong> {userDetails.phone}</div>}
                              {userDetails.bio && <div><strong>Bio:</strong> {userDetails.bio}</div>}
                              <div><strong>Joined:</strong> {new Date(userDetails.createdAt).toLocaleDateString()}</div>
                              {userDetails.lastLoginAt && (
                                <div><strong>Last Login:</strong> {new Date(userDetails.lastLoginAt).toLocaleDateString()}</div>
                              )}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle>Task Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>Total Tasks:</span>
                                <span className="font-medium">{userDetails.stats.totalTasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Active Tasks:</span>
                                <span className="font-medium text-orange-600">{userDetails.stats.activeTasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Completed Tasks:</span>
                                <span className="font-medium text-green-600">{userDetails.stats.completedTasks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Urgent Tasks:</span>
                                <span className="font-medium text-red-600">{userDetails.stats.urgentTasks}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="departments" className="space-y-4">
                        <div className="grid gap-4">
                          {userDetails.tasksByDepartment.map((dept: any) => (
                            <Card key={dept.id}>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  {dept.name} ({dept.code}) - Tasks ({dept.tasks.length})
                                  {dept.isPrimary && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  {dept.taskStats.active} active • {dept.taskStats.completed} completed
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div><strong>Roles:</strong> {dept.roles.join(', ')}</div>
                                  
                                  {/* Task Statistics */}
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center p-2 bg-blue-50 rounded">
                                      <div className="font-medium text-blue-700">{dept.taskStats.total}</div>
                                      <div className="text-blue-600">Total</div>
                                    </div>
                                    <div className="text-center p-2 bg-orange-50 rounded">
                                      <div className="font-medium text-orange-700">{dept.taskStats.active}</div>
                                      <div className="text-orange-600">Active</div>
                                    </div>
                                    <div className="text-center p-2 bg-green-50 rounded">
                                      <div className="font-medium text-green-700">{dept.taskStats.completed}</div>
                                      <div className="text-green-600">Completed</div>
                                    </div>
                                  </div>

                                  {/* Department-specific tasks */}
                                  {dept.tasks.length > 0 && (
                                    <div className="space-y-2">
                                      <strong>Recent Tasks:</strong>
                                      <div className="space-y-2">
                                        {dept.tasks.slice(0, 5).map((task: any) => (
                                          <div key={task._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{task.title}</div>
                                              <div className="text-xs text-muted-foreground">
                                                Priority: {task.priority} • Due: {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'No due date'}
                                              </div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${
                                              task.status === 'SUBMITTED' ? 'bg-green-100 text-green-800' :
                                              task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                              'bg-yellow-100 text-yellow-800'
                                            }`}>
                                              {task.status}
                                            </span>
                                          </div>
                                        ))}
                                        {dept.tasks.length > 5 && (
                                          <div className="text-sm text-muted-foreground text-center">
                                            ... and {dept.tasks.length - 5} more tasks
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {dept.tasks.length === 0 && (
                                    <div className="text-center py-4 text-muted-foreground">
                                      No tasks assigned for this department
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="tasks" className="space-y-4">
                        <div className="grid gap-4">
                          {userDetails.tasks.length === 0 ? (
                            <Card>
                              <CardContent className="pt-6 text-center">
                                <p className="text-muted-foreground">No tasks assigned to this user</p>
                              </CardContent>
                            </Card>
                          ) : (
                            userDetails.tasks.map((task: any) => (
                              <Card key={task._id}>
                                <CardContent className="pt-4">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">{task.title}</h4>
                                      <p className="text-sm text-muted-foreground">{task.description}</p>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                                          {task.priority}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                                          {task.status}
                                        </span>
                                      </div>
                                      {task.dueAt && (
                                        <p className="text-xs text-muted-foreground">
                                          Due: {new Date(task.dueAt).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setSelectedTaskId(task._id)}
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              {/* User List View */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">User Management</h3>
                <div className="flex gap-2">
              <select 
                value={departmentFilter} 
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Departments</option>
                {Array.isArray(departments) && departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Roles</option>
                <option value="HOD">Head of Department</option>
                <option value="PROFESSOR">Professor</option>
                <option value="COORDINATOR">Coordinator</option>
                <option value="VICE_CHAIRMAN">Vice Chairman</option>
              </select>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <Button onClick={fetchUsers} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="grid gap-4">
              {filteredUsersForUserManagement.map((user) => (
                <Card 
                  key={user.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setUserDetailContext('users');
                  }}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-blue-600">
                            {user.name}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.role === 'HOD' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'COORDINATOR' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          {(user as any).departmentRoles && (user as any).departmentRoles.length > 0 && (
                            <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                              Multi
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {/* Show Primary Department */}
                        {user.department && (
                          <div className="text-sm">
                            <span className="font-medium text-blue-600">Primary:</span> {user.department.name} ({user.department.code}) - {user.role}
                          </div>
                        )}
                        
                        {/* Show Additional Department Roles */}
                        {(user as any).departmentRoles && (user as any).departmentRoles.length > 0 && (
                          <div className="text-sm space-y-1">
                            <span className="font-medium text-green-600">Additional Assignments:</span>
                            {(user as any).departmentRoles.map((deptRole: any, index: number) => {
                              const dept = Array.isArray(departments) ? departments.find(d => d._id === deptRole.departmentId) : null;
                              return dept ? (
                                <div key={index} className="text-xs text-muted-foreground ml-2">
                                  • {dept.name} ({dept.code}) - {deptRole.roles.join(', ')}
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                        {user.supervisor && (
                          <p className="text-sm text-muted-foreground">
                            Supervisor: {user.supervisor.name} ({user.supervisor.role})
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        {user.lastLoginAt && (
                          <p className="text-xs text-muted-foreground">
                            Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-blue-600 mr-auto">Click to view details →</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
            </>
          )}
        </TabsContent>

        <TabsContent value="create-user" className="space-y-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Add a new user to the system (Chairman privileges)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="VICE_CHAIRMAN">Vice Chairman</option>
                    <option value="HOD">Head of Department</option>
                    <option value="COORDINATOR">Coordinator</option>
                    <option value="PROFESSOR">Professor</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Department *</label>
                  <select
                    value={newUser.departmentId}
                    onChange={(e) => setNewUser({...newUser, departmentId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Department</option>
                    {Array.isArray(departments) && departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" disabled={creatingUser} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {creatingUser ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-tasks" className="space-y-4">
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
            loading={tasksLoading}
          />
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

        {/* My Tasks Tab - Only for Vice Chairman */}
        {currentUser?.role === 'VICE_CHAIRMAN' && (
          <TabsContent value="my-tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                My Assigned Tasks
              </h3>
              <Button onClick={fetchTasks} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <TasksManagement
              tasks={tasks.filter(task => {
                // Check new assignments structure
                const assignmentMatch = task.assignments?.some(assignment => assignment.userId === currentUser?.id);
                // Check legacy assignedTo structure  
                const legacyMatch = task.assignedTo?.some(assignee => assignee.id === currentUser?.id);
                return assignmentMatch || legacyMatch;
              })}
              users={users}
              departments={departments}
              currentUser={currentUser}
              onRefresh={() => {
                fetchDepartments();
                fetchUsers();
                fetchTasks();
              }}
              loading={tasksLoading}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
                ✕
              </Button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={editUserData.name}
                    onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Primary Role & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Primary Role *</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({...editUserData, role: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="VICE_CHAIRMAN">Vice Chairman</option>
                    <option value="HOD">Head of Department</option>
                    <option value="COORDINATOR">Coordinator</option>
                    <option value="PROFESSOR">Professor</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Primary Department *</label>
                  <select
                    value={editUserData.departmentId}
                    onChange={(e) => setEditUserData({...editUserData, departmentId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Department</option>
                    {Array.isArray(departments) && departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Department Roles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Additional Department Roles</label>
                  <Button type="button" variant="outline" size="sm" onClick={addDepartmentRole}>
                    + Add Role
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {editUserData.departmentRoles.map((deptRole, index) => (
                    <div key={index} className="border rounded-md p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Department Role #{index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeDepartmentRole(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Department</label>
                          <select
                            value={deptRole.departmentId}
                            onChange={(e) => updateDepartmentRole(index, 'departmentId', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                          >
                            <option value="">Select Department</option>
                            {Array.isArray(departments) && departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name} ({dept.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Roles</label>
                          <div className="mt-1 space-y-1">
                            {['HOD', 'COORDINATOR', 'PROFESSOR'].map((role) => (
                              <label key={role} className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={deptRole.roles.includes(role)}
                                  onChange={() => updateDepartmentRole(index, 'roles', role)}
                                  className="rounded"
                                />
                                <span>{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {editUserData.departmentRoles.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No additional roles assigned. Click "Add Role" to assign roles in other departments.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingUser}>
                  {updatingUser ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}