'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, Building2, UserCheck, Clock } from 'lucide-react';

interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  departmentRoles?: {
    departmentId: string;
    roles: string[];
  }[];
  phone?: string;
  bio?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueAt?: string;
  createdAt: string;
  assignments?: {
    userId: string;
    departmentId: string;
  }[];
  assignedTo?: {
    id: string;
    name: string;
  }[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchDepartments();
      fetchUserTasks();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setError('User not found');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to fetch user details');
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUserTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d._id === departmentId);
    return dept ? `${dept.name} (${dept.code})` : 'Unknown Department';
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
      case 'ASSIGNED': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'HOD': return 'bg-purple-100 text-purple-800';
      case 'PROFESSOR': return 'bg-blue-100 text-blue-800';
      case 'COORDINATOR': return 'bg-green-100 text-green-800';
      case 'CHAIRMAN': return 'bg-red-100 text-red-800';
      case 'VICE_CHAIRMAN': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error || 'User not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{user.name}</CardTitle>
              <CardDescription className="text-lg flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
              {user.departmentRoles && user.departmentRoles.length > 0 && (
                <Badge variant="outline">Multi-Department</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{user.phone}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>

            {user.lastLoginAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Last login {new Date(user.lastLoginAt).toLocaleDateString()}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Active User</span>
            </div>
          </div>

          {user.bio && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Bio</h4>
              <p className="text-sm text-muted-foreground">{user.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Roles & Tasks */}
      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">Department Roles</TabsTrigger>
          <TabsTrigger value="tasks">Tasks ({userTasks.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid gap-4">
            {/* Legacy single department */}
            {user.departmentId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Primary Department
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{getDepartmentName(user.departmentId)}</p>
                      <p className="text-sm text-muted-foreground">Role: {user.role}</p>
                    </div>
                    <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Multi-department roles */}
            {user.departmentRoles && user.departmentRoles.length > 0 && (
              <>
                <h3 className="text-lg font-semibold">Multi-Department Roles</h3>
                {user.departmentRoles.map((deptRole, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{getDepartmentName(deptRole.departmentId)}</p>
                          <p className="text-sm text-muted-foreground">
                            Roles: {deptRole.roles.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {deptRole.roles.map((role) => (
                            <Badge key={role} className={getRoleColor(role)}>{role}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}

            {!user.departmentId && (!user.departmentRoles || user.departmentRoles.length === 0) && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-center text-muted-foreground">No department assignments found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {userTasks.length > 0 ? (
            <div className="grid gap-4">
              {userTasks.map((task) => (
                <Card key={task._id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{task.title}</h4>
                        <div className="flex gap-2">
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                        {task.dueAt && <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <p className="text-center text-muted-foreground">No tasks assigned to this user</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Account Created</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Updated</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Login</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(user.lastLoginAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasks Assigned</span>
                  <span className="text-sm text-muted-foreground">{userTasks.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
