'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskList from '@/components/tasks/TaskList';
import TaskDetail from '@/components/tasks/TaskDetail';
import CreateTaskForm from '@/components/tasks/CreateTaskForm';
import { CheckSquare, Plus } from 'lucide-react';

interface TasksManagementProps {
  tasks: any[];
  users: any[];
  departments: any[];
  currentUser: any;
  onRefresh: () => void;
  loading?: boolean;
}

export default function TasksManagement({ 
  tasks, 
  users, 
  departments, 
  currentUser, 
  onRefresh,
  loading = false 
}: TasksManagementProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

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

  if (selectedTaskId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedTaskId(null)} className="text-blue-600">
            ← Back to All Tasks
          </Button>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
        
        <TaskDetail 
          taskId={selectedTaskId}
          onBack={() => setSelectedTaskId(null)}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
        />
      </div>
    );
  }

  return (
    <Tabs defaultValue="all-tasks" className="space-y-4">
      <TabsList>
        <TabsTrigger value="all-tasks">All Tasks</TabsTrigger>
        <TabsTrigger value="create-task">Create Task</TabsTrigger>
      </TabsList>

      <TabsContent value="all-tasks" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            <h3 className="text-lg font-medium">All Tasks ({filteredTasks.length})</h3>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Filters</CardTitle>
            <CardDescription>Filter tasks by status, priority, or search terms</CardDescription>
          </CardHeader>
          <CardContent>
            <TaskFilters
              statusFilter={taskStatusFilter}
              setStatusFilter={setTaskStatusFilter}
              priorityFilter={taskPriorityFilter}
              setPriorityFilter={setTaskPriorityFilter}
              searchTerm={taskSearchTerm}
              setSearchTerm={setTaskSearchTerm}
            />
          </CardContent>
        </Card>

        <TaskList
          tasks={filteredTasks}
          departments={departments}
          onTaskClick={setSelectedTaskId}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
        />
      </TabsContent>

      <TabsContent value="create-task" className="space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <h3 className="text-lg font-medium">Create New Task</h3>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Task creation form will be integrated here</p>
              <p className="text-sm text-muted-foreground">
                This will be connected to the existing CreateTaskForm component with proper state management
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
