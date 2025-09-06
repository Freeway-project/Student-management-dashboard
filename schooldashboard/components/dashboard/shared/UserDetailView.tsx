'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, User, CheckSquare } from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface UserDetailViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
    bio?: string;
    createdAt: string;
    lastLoginAt?: string | null;
    department?: { id: string; name: string; code: string } | null;
    supervisor?: { id: string; name: string; email: string; role: string } | null;
  };
  userDetails: {
    tasks: any[];
    departments: any[];
    stats: {
      totalTasks: number;
      activeTasks: number;
      completedTasks: number;
      urgentTasks: number;
      totalDepartments: number;
    };
  };
  onBack: () => void;
  onRefresh: () => void;
  onTaskClick?: (taskId: string) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  departments: Department[];
}

export default function UserDetailView({
  user,
  userDetails,
  onBack,
  onRefresh,
  onTaskClick,
  getPriorityColor,
  getStatusColor,
  departments
}: UserDetailViewProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="text-blue-600">
          ← Back to Users
        </Button>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {/* User Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6" />
              {user.name}
            </CardTitle>
            <div className="text-lg text-muted-foreground">
              {user.role} • {user.email}
            </div>
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
                  <div><strong>Name:</strong> {user.name}</div>
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Role:</strong> {user.role}</div>
                  {user.phone && <div><strong>Phone:</strong> {user.phone}</div>}
                  {user.bio && <div><strong>Bio:</strong> {user.bio}</div>}
                  <div><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
                  {user.lastLoginAt && (
                    <div><strong>Last Login:</strong> {new Date(user.lastLoginAt).toLocaleDateString()}</div>
                  )}
                  {user.supervisor && (
                    <div><strong>Supervisor:</strong> {user.supervisor.name} ({user.supervisor.role})</div>
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
                  <div className="flex justify-between">
                    <span>Completion Rate:</span>
                    <span className="font-medium">
                      {userDetails.stats.totalTasks > 0 
                        ? Math.round((userDetails.stats.completedTasks / userDetails.stats.totalTasks) * 100) 
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="grid gap-4">
              {userDetails.departments.map((dept: any) => (
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
                      {/* Show department-specific tasks */}
                      {(() => {
                        const deptTasks = userDetails.tasks.filter((task: any) => 
                          task.departmentId === dept.id
                        );
                        return (
                          <div>
                            <strong>Department Tasks:</strong> {deptTasks.length}
                            {deptTasks.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {deptTasks.slice(0, 3).map((task: any) => (
                                  <div key={task._id} className="text-sm text-muted-foreground">
                                    • {task.title} ({task.status})
                                  </div>
                                ))}
                                {deptTasks.length > 3 && (
                                  <div className="text-sm text-muted-foreground">
                                    ... and {deptTasks.length - 3} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5" />
              <h3 className="text-lg font-medium">All Tasks ({userDetails.tasks.length})</h3>
            </div>
            
            <div className="grid gap-4">
              {userDetails.tasks.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No tasks assigned to this user</p>
                  </CardContent>
                </Card>
              ) : (
                userDetails.tasks.map((task: any) => (
                  <Card 
                    key={task._id} 
                    className={onTaskClick ? "cursor-pointer hover:bg-gray-50" : ""}
                    onClick={() => onTaskClick && onTaskClick(task._id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                              {task.status.replace(/_/g, ' ')}
                            </span>
                            {task.departmentId && (() => {
                              const dept = departments.find(d => d._id === task.departmentId);
                              return dept ? (
                                <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                                  {dept.code}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          {task.dueAt && (
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueAt).toLocaleDateString()}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(task.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {onTaskClick && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskClick(task._id);
                            }}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
