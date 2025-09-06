'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, FileText, TrendingUp } from 'lucide-react';

interface StatsOverviewProps {
  departments: any[];
  users: any[];
  tasks: any[];
  loading?: boolean;
}

export default function StatsOverview({ departments, users, tasks, loading }: StatsOverviewProps) {
  const getTotalActiveUsers = () => {
    return users.length;
  };

  const getTotalPendingTasks = () => {
    return tasks.filter(task => task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS').length;
  };

  const getCompletedTasksPercentage = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'COMPLETED' || task.status === 'SUBMITTED').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getDepartmentTaskStats = (departmentId: string) => {
    const departmentTasks = tasks.filter(task => 
      task.departmentId === departmentId || 
      task.assignments?.some((assignment: any) => assignment.departmentId === departmentId)
    );
    
    const totalTasks = departmentTasks.length;
    const pendingTasks = departmentTasks.filter(task => task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS').length;
    const completedTasks = departmentTasks.filter(task => task.status === 'COMPLETED' || task.status === 'SUBMITTED').length;
    const overdueTasks = departmentTasks.filter(task => {
      if (!task.dueAt) return false;
      return new Date(task.dueAt) < new Date() && task.status !== 'COMPLETED' && task.status !== 'SUBMITTED';
    }).length;

    return {
      total: totalTasks,
      pending: pendingTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const getOverallTaskStatistics = () => {
    if (!Array.isArray(departments)) return [];
    return departments.map(dept => ({
      departmentId: dept._id,
      departmentName: dept.name,
      departmentCode: dept.code,
      ...getDepartmentTaskStats(dept._id)
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(departments) ? departments.filter(d => d.isActive).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">Active departments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalActiveUsers()}</div>
            <p className="text-xs text-muted-foreground">Total staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalPendingTasks()}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletedTasksPercentage()}%</div>
            <p className="text-xs text-muted-foreground">Overall completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Department-wise Task Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Department-wise Task Statistics</CardTitle>
          <CardTitle className="text-sm text-muted-foreground">Task performance across all departments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getOverallTaskStatistics().map((deptStat) => (
              <div key={deptStat.departmentId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{deptStat.departmentName}</h3>
                    <p className="text-sm text-muted-foreground">Code: {deptStat.departmentCode}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{deptStat.completionRate}%</div>
                    <div className="text-xs text-muted-foreground">Completion Rate</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-blue-600">{deptStat.total}</div>
                    <div className="text-xs text-muted-foreground">Total Tasks</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-yellow-600">{deptStat.pending}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-green-600">{deptStat.completed}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-red-600">{deptStat.overdue}</div>
                    <div className="text-xs text-muted-foreground">Overdue</div>
                  </div>
                </div>
                {deptStat.total > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${deptStat.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {getOverallTaskStatistics().length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No task data available yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
