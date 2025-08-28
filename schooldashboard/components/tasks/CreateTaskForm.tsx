import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CreateTaskFormProps {
    newTask: any;
    setNewTask: (task: any) => void;
    selectedDepartments: string[];
    setSelectedDepartments: (departments: string[]) => void;
    filteredUsers: any[];
    handleUserSelect: (userId: string) => void;
    handleCreateTask: (e: React.FormEvent) => Promise<void>;
    creating: boolean;
    departments: any[];
    users: any[];
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
    newTask,
    setNewTask,
    selectedDepartments,
    setSelectedDepartments,
    filteredUsers,
    handleUserSelect,
    handleCreateTask,
    creating,
    departments,
    users,
}) => {



    return (
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
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
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
                                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-md"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description *</label>
                        <textarea
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
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
                                            onChange={() => setSelectedDepartments((prev) =>
                                                prev.includes(dept._id)
                                                    ? prev.filter((id) => id !== dept._id)
                                                    : [...prev, dept._id]
                                            )}
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
                                    {selectedDepartments.map((deptId) => {
                                        const dept = departments.find((d) => d._id === deptId);
                                        return dept ? (
                                            <Badge key={deptId} variant="secondary" className="text-xs">
                                                {dept.name}
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedDepartments((prev) => prev.filter((id) => id !== deptId))}
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
                                        <div
                                            key={user.id}
                                            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                                        >
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
                                                : 'No users in selected departments'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deliverable Upload */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium">Deliverables</label>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Enter deliverable name (e.g., Report)"
                                className="w-full px-3 py-2 border rounded-md"
                                onChange={(e) => {
                                    const updatedDeliverables = [...(newTask.requiredDeliverables || [])];
                                    if (!updatedDeliverables[0]) {
                                        updatedDeliverables[0] = {};
                                    }
                                    updatedDeliverables[0].label = e.target.value;
                                    setNewTask({ ...newTask, requiredDeliverables: updatedDeliverables });
                                }}
                            />

                        </div>
                    </div>

                    {/* Deliverable Type */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium">Deliverable Type</label>
                        <select
                            className="w-full px-3 py-2 border rounded-md"
                            onChange={(e) => {
                                const updatedDeliverables = [...(newTask.requiredDeliverables || [])];
                                if (!updatedDeliverables[0]) {
                                    updatedDeliverables[0] = {};
                                }
                                updatedDeliverables[0].type = e.target.value;
                                setNewTask({ ...newTask, requiredDeliverables: updatedDeliverables });
                            }}
                        >
                            <option value="PDF">PDF</option>
                            <option value="EXCEL">Excel</option>
                            <option value="URL">URL</option>
                        </select>
                    </div>

                    {/* Deliverable File Upload */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium">Upload Deliverable File</label>
                        <input
                            type="file"
                            className="w-full px-3 py-2 border rounded-md"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);

                                    try {
                                        const response = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formData,
                                        });

                                        if (response.ok) {
                                            const { fileUrl } = await response.json();
                                            const updatedDeliverables = [...(newTask.requiredDeliverables || [])];
                                            if (!updatedDeliverables[0]) {
                                                updatedDeliverables[0] = {};
                                            }
                                            updatedDeliverables[0].fileUrl = fileUrl;
                                            setNewTask({ ...newTask, requiredDeliverables: updatedDeliverables });
                                        } else {
                                            console.error('File upload failed');
                                        }
                                    } catch (error) {
                                        console.error('Error uploading file:', error);
                                    }
                                }
                            }}
                        />
                    </div>

                    <Button type="submit" disabled={creating} className="w-full">
                        {creating ? 'Creating Task...' : 'Create Task'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default CreateTaskForm;
