import React from 'react';
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
                                            onChange={() => {
                                                const newSelectedDepartments = selectedDepartments.includes(dept._id)
                                                    ? selectedDepartments.filter((id) => id !== dept._id)
                                                    : [...selectedDepartments, dept._id];
                                                setSelectedDepartments(newSelectedDepartments);
                                            }}
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
                                                    onClick={() => {
                                                        const newSelectedDepartments = selectedDepartments.filter((id) => id !== deptId);
                                                        setSelectedDepartments(newSelectedDepartments);
                                                    }}
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

                        {/* User Selection with Department Roles */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Assign to Users by Department & Role
                                <span className="text-muted-foreground ml-2">
                                    ({selectedDepartments.length === 0 ? 'All' : 'Filtered by department'})
                                </span>
                            </label>
                            <div className="max-h-96 overflow-y-auto border rounded-md p-2">
                                <div className="space-y-4">
                                    {filteredUsers.map((user) => {
                                        // Get all user's department-role combinations
                                        const userDepartments: any[] = [];
                                        
                                        // Add primary department
                                        if (user.department) {
                                            userDepartments.push({
                                                departmentId: user.department.id,
                                                departmentName: user.department.name,
                                                departmentCode: user.department.code,
                                                roles: [user.role],
                                                isPrimary: true
                                            });
                                        }
                                        
                                        // Add additional departments from departmentRoles
                                        if ((user as any).departmentRoles) {
                                            (user as any).departmentRoles.forEach((deptRole: any) => {
                                                const dept = departments.find(d => d._id === deptRole.departmentId);
                                                if (dept && !userDepartments.some(ud => ud.departmentId === dept._id)) {
                                                    userDepartments.push({
                                                        departmentId: dept._id,
                                                        departmentName: dept.name,
                                                        departmentCode: dept.code,
                                                        roles: deptRole.roles,
                                                        isPrimary: false
                                                    });
                                                }
                                            });
                                        }

                                        return (
                                            <div key={user.id} className="border rounded-lg p-3 bg-gray-50">
                                                <div className="font-medium text-sm mb-2 flex items-center gap-2">
                                                    {user.name}
                                                    <span className="text-xs text-muted-foreground">({user.email})</span>
                                                    {userDepartments.length > 1 && (
                                                        <Badge variant="outline" className="text-xs bg-orange-100">
                                                            Multi
                                                        </Badge>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-2">
                                                    {userDepartments.map((userDept, deptIndex) => (
                                                        <div key={`${user.id}-${userDept.departmentId}`} className="ml-2">
                                                            <div className="text-xs font-medium text-blue-600 mb-1">
                                                                {userDept.departmentName} ({userDept.departmentCode})
                                                                {userDept.isPrimary && <span className="ml-1 text-blue-500">Primary</span>}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 ml-2">
                                                                {userDept.roles.map((role: string) => {
                                                                    const assignmentKey = `${user.id}-${userDept.departmentId}-${role}`;
                                                                    const isSelected = newTask.assignments && newTask.assignments.some((assignment: any) => 
                                                                        assignment.userId === user.id && 
                                                                        assignment.departmentId === userDept.departmentId && 
                                                                        assignment.assignedRole === role
                                                                    );
                                                                    
                                                                    return (
                                                                        <label key={assignmentKey} className="flex items-center space-x-1 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={() => {
                                                                                    const currentAssignments = newTask.assignments || [];
                                                                                    const existingIndex = currentAssignments.findIndex((assignment: any) => 
                                                                                        assignment.userId === user.id && 
                                                                                        assignment.departmentId === userDept.departmentId && 
                                                                                        assignment.assignedRole === role
                                                                                    );
                                                                                    
                                                                                    let updatedAssignments;
                                                                                    if (existingIndex >= 0) {
                                                                                        // Remove assignment
                                                                                        updatedAssignments = currentAssignments.filter((_: any, index: number) => index !== existingIndex);
                                                                                    } else {
                                                                                        // Add assignment
                                                                                        updatedAssignments = [...currentAssignments, {
                                                                                            userId: user.id,
                                                                                            departmentId: userDept.departmentId,
                                                                                            assignedRole: role,
                                                                                            userName: user.name,
                                                                                            departmentName: userDept.departmentName,
                                                                                            departmentCode: userDept.departmentCode
                                                                                        }];
                                                                                    }
                                                                                    
                                                                                    setNewTask({ ...newTask, assignments: updatedAssignments });
                                                                                }}
                                                                                className="rounded border-gray-300"
                                                                            />
                                                                            <span className={`text-xs px-2 py-1 rounded ${
                                                                                role === 'HOD' ? 'bg-purple-100 text-purple-800' :
                                                                                role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                                                                                role === 'COORDINATOR' ? 'bg-green-100 text-green-800' :
                                                                                'bg-gray-100 text-gray-800'
                                                                            }`}>
                                                                                {role}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                        
                        {/* Show Selected Assignments Summary */}
                        {newTask.assignments && newTask.assignments.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Selected Assignments ({newTask.assignments.length})</label>
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <div className="space-y-1">
                                        {newTask.assignments.map((assignment: any, index: number) => (
                                            <div key={index} className="text-sm flex items-center justify-between">
                                                <span>
                                                    <strong>{assignment.userName}</strong> - {assignment.assignedRole} at {assignment.departmentName} ({assignment.departmentCode})
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedAssignments = newTask.assignments.filter((_: any, i: number) => i !== index);
                                                        setNewTask({ ...newTask, assignments: updatedAssignments });
                                                    }}
                                                    className="text-red-500 hover:text-red-700 ml-2"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
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


                    <Button type="submit" disabled={creating} className="w-full">
                        {creating ? 'Creating Task...' : 'Create Task'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default CreateTaskForm;
