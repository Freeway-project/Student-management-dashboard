import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Building } from 'lucide-react';

interface TaskListProps {
  tasks: any[];
  departments: any[];
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  onTaskClick?: (taskId: string) => void;
}

interface User {
  id: string;
  name: string;
  role: string;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, departments, getPriorityColor, getStatusColor, onTaskClick }) => {
  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Card 
          key={task._id} 
          className={`hover:shadow-md transition-shadow ${onTaskClick ? 'cursor-pointer' : ''}`}
          onClick={() => onTaskClick && onTaskClick(task._id)}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="flex items-center gap-2">
                  {task.title}
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace(/_/g, ' ')}
                  </Badge>
                </CardTitle>
                <CardDescription>{task.description}</CardDescription>
                {task.instructions && task.instructions !== task.description && (
                  <CardDescription className="text-xs">
                    <strong>Instructions:</strong> {task.instructions}
                  </CardDescription>
                )}
              </div>
              {task.dueAt && (
                <div className="text-right text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {new Date(task.dueAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {task.assignedTo && task.assignedTo.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Assigned to: </span>
                  <div className="flex gap-1">
                    {task.assignedTo.map((user: User, index: number) => (
                      <Badge key={user.id || `user-${index}`} variant="outline">
                        {user.name} ({user.role})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {task.assignedBy && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Assigned by: </span>
                  <Badge variant="outline">
                    {task.assignedBy.name} ({task.assignedBy.role})
                  </Badge>
                </div>
              )}
              {task.departmentId && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Department: </span>
                  <Badge variant="outline">
                    {departments.find((d) => d._id === task.departmentId)?.name || 'Unknown'}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                Created: {new Date(task.createdAt).toLocaleDateString()}
                <span className="mx-2">•</span>
                Updated: {new Date(task.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {tasks.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="text-muted-foreground">No tasks found matching the current filters.</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskList;
