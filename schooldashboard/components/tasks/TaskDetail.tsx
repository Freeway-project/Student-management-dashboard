import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  Download,
  Eye
} from 'lucide-react';

interface TaskDetailProps {
  taskId: string;
  onBack: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

interface Submission {
  _id: string;
  submittedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  submissionType: string;
  version: number;
  title?: string;
  description?: string;
  content?: string;
  notes?: string;
  attachments: any[];
  status: string;
  submittedAt: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewFeedback?: string;
  reviewScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface Assignment {
  _id: string;
  assignee: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assigneeRole: string;
  status: string;
  lastSubmittedAt?: string;
  attempts: number;
}

interface TaskData {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  priority: string;
  status: string;
  dueAt?: string;
  assignedBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  assignedTo: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  requiredDeliverables: any[];
  createdAt: string;
  updatedAt: string;
}

const TaskDetail: React.FC<TaskDetailProps> = ({ 
  taskId, 
  onBack, 
  getPriorityColor, 
  getStatusColor 
}) => {
  const [task, setTask] = useState<TaskData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        setSubmissions(data.submissions);
        setAssignments(data.assignments);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'REVISION_REQUESTED': return 'bg-orange-100 text-orange-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'IN_REVIEW': return <Eye className="h-4 w-4 text-blue-600" />;
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'NOT_SUBMITTED': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading task details...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Task not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tasks
        </Button>
      </div>

      {/* Task Overview */}
      <Card>
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
                <div className="text-sm">
                  <strong>Instructions:</strong> {task.instructions}
                </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Assigned by:</span>
              </div>
              <Badge variant="outline">
                {task.assignedBy.name} ({task.assignedBy.role})
              </Badge>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Assigned to:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {task.assignedTo.map(user => (
                  <Badge key={user._id} variant="outline" className="text-xs">
                    {user.name} ({user.role})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {task.requiredDeliverables && task.requiredDeliverables.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Required Deliverables:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {task.requiredDeliverables.map((deliverable, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {deliverable.label || deliverable.type} ({deliverable.type})
                    {deliverable.optional && <span className="ml-1 text-xs opacity-75">- Optional</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Submissions and Assignments */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">
            All Submissions ({submissions.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            Assignment Status ({assignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions" className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="text-muted-foreground">No submissions yet</div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {submission.title || 'Submission'}
                          <Badge className={getSubmissionStatusColor(submission.status)}>
                            {submission.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            v{submission.version}
                          </Badge>
                        </CardTitle>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>
                              <strong>{submission.submittedBy.name}</strong> ({submission.submittedBy.role})
                            </span>
                            <span>•</span>
                            <span className="text-xs">{submission.submittedBy.email}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                Submitted: {submission.submittedAt 
                                  ? new Date(submission.submittedAt).toLocaleString()
                                  : 'Draft'
                                }
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {submission.submissionType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {submission.description && (
                        <div>
                          <strong className="text-sm">Description:</strong>
                          <p className="text-sm text-muted-foreground mt-1">{submission.description}</p>
                        </div>
                      )}
                      
                      {submission.content && (
                        <div>
                          <strong className="text-sm">Content:</strong>
                          <p className="text-sm text-muted-foreground mt-1">{submission.content}</p>
                        </div>
                      )}

                      {submission.notes && (
                        <div>
                          <strong className="text-sm">Notes:</strong>
                          <p className="text-sm text-muted-foreground mt-1">{submission.notes}</p>
                        </div>
                      )}

                      {submission.attachments && submission.attachments.length > 0 && (
                        <div>
                          <strong className="text-sm">Attachments:</strong>
                          <div className="space-y-2 mt-2">
                            {submission.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-600" />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {attachment.originalName || attachment.filename || `File ${index + 1}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {attachment.mimeType} • Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {attachment.driveFileId && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(attachment.driveFileId, '_blank')}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const link = document.createElement('a');
                                          link.href = attachment.driveFileId;
                                          link.download = attachment.originalName || attachment.filename || 'download';
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }}
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {submission.reviewedBy && (
                        <div className="border-t pt-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <strong className="text-sm">Reviewed by:</strong>
                            <Badge variant="outline">
                              {submission.reviewedBy.name} ({submission.reviewedBy.role})
                            </Badge>
                          </div>
                          {submission.reviewFeedback && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Feedback:</strong> {submission.reviewFeedback}
                            </p>
                          )}
                          {submission.reviewScore && (
                            <p className="text-sm text-muted-foreground">
                              <strong>Score:</strong> {submission.reviewScore}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid gap-4">
            {assignments.map((assignment) => (
              <Card key={assignment._id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getAssignmentStatusIcon(assignment.status)}
                      <div>
                        <div className="font-medium">{assignment.assignee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.assignee.email} • {assignment.assignee.role}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status.replace(/_/g, ' ')}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {assignment.lastSubmittedAt 
                          ? `Last submitted: ${new Date(assignment.lastSubmittedAt).toLocaleDateString()}`
                          : 'Not submitted'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskDetail;