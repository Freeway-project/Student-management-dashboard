'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  dueDate: string;
  assignedTo: User[];
  createdBy: User;
  departments: Department[];
  createdAt: string;
  updatedAt: string;
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    departments: [] as string[]
  });
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

      // Mock tasks data for now (since backend isn't implemented yet)
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Review Curriculum Updates',
          description: 'Review and approve the proposed curriculum changes for Computer Science department',
          priority: 'HIGH',
          status: 'TODO',
          dueDate: '2024-01-15',
          assignedTo: [],
          createdBy: { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', department: null },
          departments: [],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ];
      setTasks(mockTasks);
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
    setCreating(true);
    
    try {
      // Mock task creation for now
      const mockNewTask: Task = {
        id: Math.random().toString(),
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: 'TODO',
        dueDate: newTask.dueDate,
        assignedTo: users.filter(user => newTask.assignedTo.includes(user.id)),
        createdBy: { id: '1', name: 'Current User', email: 'current@example.com', role: 'ADMIN', department: null },
        departments: departments.filter(dept => selectedDepartments.includes(dept._id)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTasks([mockNewTask, ...tasks]);
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assignedTo: [],
        departments: []
      });
      setSelectedDepartments([]);
      
      console.log('Task created successfully!');
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
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'REVIEW': return 'bg-purple-100 text-purple-800';
      case 'TODO': return 'bg-gray-100 text-gray-800';
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="create">Create Task</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Priority</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        {task.title}
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {task.assignedTo.length > 0 && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Assigned to: </span>
                        <div className="flex gap-1">
                          {task.assignedTo.map(user => (
                            <Badge key={user.id} variant="outline">
                              {user.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.departments.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Departments: </span>
                        <div className="flex gap-1">
                          {task.departments.map(dept => (
                            <Badge key={dept._id} variant="outline">
                              {dept.name} ({dept.code})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Created: {new Date(task.createdAt).toLocaleDateString()}
                      <span className="mx-2">•</span>
                      By: {task.createdBy.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredTasks.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <div className="text-muted-foreground">No tasks found matching the current filters.</div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Task
              </CardTitle>
              <CardDescription>
                Create a new task and assign it to users from specific departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-6">
                {/* Basic Task Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Task Title *</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Enter task title..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date *</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                    placeholder="Describe the task in detail..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                {/* Department Filter for User Selection */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter Users by Department</label>
                    <div className="grid gap-2 md:grid-cols-3">
                      {departments.map((dept) => (
                        <div key={dept._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`dept-${dept._id}`}
                            checked={selectedDepartments.includes(dept._id)}
                            onChange={() => handleDepartmentSelect(dept._id)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`dept-${dept._id}`} className="text-sm">
                            {dept.name} ({dept.code})
                          </label>
                        </div>
                      ))}
                    </div>
                    {selectedDepartments.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Selected:</span>
                        {selectedDepartments.map(deptId => {
                          const dept = departments.find(d => d._id === deptId);
                          return dept ? (
                            <Badge key={deptId} variant="secondary" className="text-xs">
                              {dept.name}
                              <button
                                type="button"
                                onClick={() => handleDepartmentSelect(deptId)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* User Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Assign to Users 
                      <span className="text-muted-foreground ml-2">
                        ({selectedDepartments.length === 0 ? 'All' : 'Filtered by department'})
                      </span>
                    </label>
                    <div className="max-h-64 overflow-y-auto border rounded-md p-2">
                      <div className="grid gap-2">
                        {filteredUsers.map((user) => (
                          <div key={user.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={newTask.assignedTo.includes(user.id)}
                              onChange={() => handleUserSelect(user.id)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`user-${user.id}`} className="flex-1 text-sm cursor-pointer">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-muted-foreground text-xs">{user.email}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {user.role}
                                  </Badge>
                                  {user.department && (
                                    <Badge variant="outline" className="text-xs">
                                      {user.department.name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </label>
                          </div>
                        ))}
                        {filteredUsers.length === 0 && (
                          <div className="text-center text-muted-foreground py-4">
                            {selectedDepartments.length === 0 
                              ? 'No users available' 
                              : 'No users in selected departments'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    {newTask.assignedTo.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Assigned to:</span>
                        {newTask.assignedTo.map(userId => {
                          const user = users.find(u => u.id === userId);
                          return user ? (
                            <Badge key={userId} variant="secondary" className="text-xs">
                              {user.name}
                              <button
                                type="button"
                                onClick={() => handleUserSelect(userId)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? 'Creating Task...' : 'Create Task'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}