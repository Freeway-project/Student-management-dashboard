'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCheck, CheckSquare, Clock, AlertCircle, Upload, File, X, RefreshCw } from 'lucide-react';

interface Deliverable {
  type: 'PDF' | 'EXCEL' | 'URL';
  label: string;
  optional: boolean;
  fileUrl?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  instructions?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED';
  dueAt?: string;
  assignedTo: { id: string; name: string; email: string; role: string }[];
  assignedBy: { id: string; name: string; email: string; role: string };
  requiredDeliverables: Deliverable[];
  submissionMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: number]: number}>({});
  const [submissionMessage, setSubmissionMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?userId=${user?.id}&role=${user?.role}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
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

  const handleFileUpload = async (deliverableIndex: number, file: File) => {
    try {
      // Show upload progress
      setUploadProgress(prev => ({ ...prev, [deliverableIndex]: 0 }));

      // Upload file immediately
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      // Store only the file URL
      setUploadedFiles(prev => ({
        ...prev,
        [deliverableIndex]: data.url
      }));

      // Complete progress
      setUploadProgress(prev => ({ ...prev, [deliverableIndex]: 100 }));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload ${file.name}. Please try again.`);
      // Clear progress on error
      setUploadProgress(prev => {
        const updated = { ...prev };
        delete updated[deliverableIndex];
        return updated;
      });
    }
  };

  const handleUrlInput = (deliverableIndex: number, url: string) => {
    setUploadedFiles(prev => ({
      ...prev,
      [deliverableIndex]: url
    }));
  };

  const handleStatusUpdate = async (taskId: string, newStatus: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED') => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchTasks(); // Refresh tasks
      } else {
        const error = await response.json();
        alert(`Error updating status: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error updating task status. Please try again.');
    }
  };

  const handleTaskSubmit = async (taskId: string) => {
    if (!selectedTask) return;

    setSubmitting(true);
    try {


      // Prepare deliverables with only fileUrl
      const deliverables = selectedTask.requiredDeliverables.map((deliverable, index) => {
        const fileUrl = uploadedFiles[index];
        return {
          type: deliverable.type,
          label: deliverable.label,
          optional: deliverable.optional,
          fileUrl: fileUrl || null
        };
      });

      // Create submission payload
      const submissionData = {
        taskId,
        status: 'SUBMITTED',
        message: submissionMessage.trim() || undefined,
        deliverables
      };

      console.log('🚀 ~ :182 ~ handleTaskSubmit ~ submissionData::==', submissionData)


      const response = await fetch(`/api/tasks/${taskId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        fetchTasks(); // Refresh tasks
        setSelectedTask(null); // Close modal
        setUploadedFiles({}); // Clear uploaded files
        setUploadProgress({}); // Clear upload progress
        setSubmissionMessage(''); // Clear message
      } else {
        const error = await response.json();
        alert(`Error submitting task: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      alert('Error submitting task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CheckSquare className="h-8 w-8" />
          My Tasks
        </h2>
        <Button
          onClick={fetchTasks}
          variant="outline"
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">Assigned to you</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(task => task.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working on
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(task => task.status === 'SUBMITTED').length}
            </div>
            <p className="text-xs text-muted-foreground">Completed tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter(task => task.priority === 'URGENT').length}
            </div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>Click on a task to view details and submit</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({tasks.length})
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Assigned ({tasks.filter(task => task.status === 'ASSIGNED').length})
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress ({tasks.filter(task => task.status === 'IN_PROGRESS').length})
              </TabsTrigger>
              <TabsTrigger value="submitted">
                Submitted ({tasks.filter(task => task.status === 'SUBMITTED').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task._id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {task.description}
                          </p>
                          {task.dueAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {new Date(task.dueAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assigned">
              {tasks.filter(task => task.status === 'ASSIGNED').length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No assigned tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.filter(task => task.status === 'ASSIGNED').map((task) => (
                    <div
                      key={task._id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {task.description}
                          </p>
                          {task.dueAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {new Date(task.dueAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="in_progress">
              {tasks.filter(task => task.status === 'IN_PROGRESS').length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks in progress</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.filter(task => task.status === 'IN_PROGRESS').map((task) => (
                    <div
                      key={task._id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {task.description}
                          </p>
                          {task.dueAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {new Date(task.dueAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="submitted">
              {tasks.filter(task => task.status === 'SUBMITTED').length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No submitted tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.filter(task => task.status === 'SUBMITTED').map((task) => (
                    <div
                      key={task._id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {task.description}
                          </p>
                          {task.dueAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Due: {new Date(task.dueAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {selectedTask.title}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTask(null);
                    setUploadedFiles({});
                    setUploadProgress({});
                    setSubmissionMessage('');
                  }}
                >
                  ✕
                </Button>
              </CardTitle>
              <CardDescription>
                Assigned by: {selectedTask.assignedBy.name} ({selectedTask.assignedBy.email})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-muted-foreground">{selectedTask.description}</p>
              </div>

              {selectedTask.instructions && (
                <div>
                  <h4 className="font-semibold mb-2">Instructions</h4>
                  <p className="text-muted-foreground">{selectedTask.instructions}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Priority</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTask.priority)}`}>
                    {selectedTask.priority}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Status</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTask.status)}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {selectedTask.dueAt && (
                <div>
                  <h4 className="font-semibold mb-1">Due Date</h4>
                  <p className="text-muted-foreground">
                    {new Date(selectedTask.dueAt).toLocaleDateString()} at{' '}
                    {new Date(selectedTask.dueAt).toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-1">Created</h4>
                <p className="text-muted-foreground">
                  {new Date(selectedTask.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Previous Submission Message */}
              {selectedTask.status === 'SUBMITTED' && selectedTask.submissionMessage && (
                <div>
                  <h4 className="font-semibold mb-1">Submission Message</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{selectedTask.submissionMessage}</p>
                  </div>
                </div>
              )}

              {/* Required Deliverables */}
              {selectedTask.requiredDeliverables && selectedTask.requiredDeliverables.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Required Deliverables</h4>
                  <div className="space-y-4">
                    {selectedTask.requiredDeliverables.map((deliverable, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{deliverable.label}</h5>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              deliverable.type === 'PDF' ? 'bg-red-100 text-red-800' :
                              deliverable.type === 'EXCEL' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {deliverable.type}
                            </span>
                            {!deliverable.optional && (
                              <span className="px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                                Required
                              </span>
                            )}
                          </div>
                        </div>

                        {deliverable.type === 'URL' ? (
                          <div>
                            <input
                              type="url"
                              placeholder="Enter URL..."
                              className="w-full p-2 border rounded-md"
                              value={(uploadedFiles[index] || '')}
                              onChange={(e) => handleUrlInput(index, e.target.value)}
                              disabled={selectedTask.status === 'SUBMITTED'}
                            />
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              accept={deliverable.type === 'PDF' ? '.pdf' : '.xlsx,.xls,.csv'}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(index, file);
                              }}
                              className="hidden"
                              id={`file-${index}`}
                              disabled={selectedTask.status === 'SUBMITTED'}
                            />
                            <label
                              htmlFor={`file-${index}`}
                              className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 ${
                                selectedTask.status === 'SUBMITTED' ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {uploadedFiles[index] ? (
                                <div className="flex items-center gap-2">
                                  <File className="h-4 w-4" />
                                  <span className="text-sm">{uploadedFiles[index] || ''}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setUploadedFiles(prev => {
                                        const updated = { ...prev };
                                        delete updated[index];
                                        return updated;
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                    disabled={selectedTask.status === 'SUBMITTED'}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Upload className="h-4 w-4" />
                                  <span className="text-sm">
                                    Upload {deliverable.type} file
                                  </span>
                                </div>
                              )}
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submission Message */}
              {selectedTask.status !== 'SUBMITTED' && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Notes (Optional)</h4>
                  <textarea
                    placeholder="Add any notes or comments about your submission..."
                    className="w-full p-3 border rounded-md resize-none"
                    rows={3}
                    value={submissionMessage}
                    onChange={(e) => setSubmissionMessage(e.target.value)}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {submissionMessage.length}/500 characters
                  </p>
                </div>
              )}

              {/* Status Update Buttons */}
              {selectedTask.status !== 'SUBMITTED' && (
                <div className="space-y-3 pt-4">
                  <div className="flex gap-2">
                    {selectedTask.status === 'ASSIGNED' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedTask._id, 'IN_PROGRESS')}
                        className="flex-1"
                      >
                        Start Working
                      </Button>
                    )}
                    {selectedTask.status === 'IN_PROGRESS' && (
                      <Button
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedTask._id, 'ASSIGNED')}
                        className="flex-1"
                      >
                        Mark as Assigned
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => handleTaskSubmit(selectedTask._id)}
                    disabled={submitting}
                    className="w-full"
                  >
                    {submitting ? 'Submitting...' : 'Submit Task'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
