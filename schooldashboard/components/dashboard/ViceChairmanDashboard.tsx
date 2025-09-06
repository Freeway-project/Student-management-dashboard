'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, Users, AlertCircle, FileText, TrendingUp, Filter, UserPlus, User } from 'lucide-react';
import { toast } from 'sonner';

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
  supervisor: { id: string; name: string; email: string; role: string } | null;
  lastLoginAt: string | null;
  createdAt: string;
  phone?: string;
  bio?: string;
}

export default function ViceChairmanDashboard() {
  const router = useRouter();
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [creating, setCreating] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    departmentId: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit user states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: '',
    departmentId: '',
    departmentRoles: [] as Array<{ departmentId: string; roles: string[] }>
  });

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDepartment)
      });
      
      if (response.ok) {
        const createdDept = await response.json();
        setDepartments([...departments, createdDept]);
        setNewDepartment({ name: '', code: '', description: '' });
        toast.success(`Department "${createdDept.name}" created successfully!`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create department');
      }
    } catch (error) {
      toast.error('Error creating department');
    } finally {
      setCreating(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.append('role', roleFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/users/all-users?${params}`, {
        headers: {
          'x-current-user': JSON.stringify({ role: 'PROGRAM_ADMIN', email: 'admin@example.com' })
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      toast.error('Error fetching users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-current-user': JSON.stringify({ role: 'PROGRAM_ADMIN', email: 'admin@example.com' })
        },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        const createdUser = await response.json();
        setUsers([...users, createdUser]);
        setNewUser({ name: '', email: '', password: '', role: '', departmentId: '' });
        toast.success(`User "${createdUser.name}" created successfully!`);
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Error creating user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully!');
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    const userWithRoles = user as any;
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.department?.id || '',
      departmentRoles: userWithRoles.departmentRoles || [] // Load existing department roles
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setUpdatingUser(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-current-user': JSON.stringify({ role: 'VICE_CHAIRMAN', email: 'vice@example.com' })
        },
        body: JSON.stringify({
          name: editUserData.name,
          email: editUserData.email,
          role: editUserData.role,
          departmentId: editUserData.departmentId,
          departmentRoles: editUserData.departmentRoles.filter(dr => dr.roles.length > 0)
        })
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => user.id === editingUser.id ? updatedUser : user));
        setEditingUser(null);
        setEditUserData({ name: '', email: '', role: '', departmentId: '', departmentRoles: [] });
        toast.success(`User "${updatedUser.name}" updated successfully!`);
      } else {
        const error = await response.text();
        toast.error(error || 'Failed to update user');
      }
    } catch (error) {
      toast.error('Error updating user');
    } finally {
      setUpdatingUser(false);
    }
  };

  const addDepartmentRole = () => {
    setEditUserData({
      ...editUserData,
      departmentRoles: [...editUserData.departmentRoles, { departmentId: '', roles: [] }]
    });
  };

  const removeDepartmentRole = (index: number) => {
    setEditUserData({
      ...editUserData,
      departmentRoles: editUserData.departmentRoles.filter((_, i) => i !== index)
    });
  };

  const updateDepartmentRole = (index: number, field: 'departmentId' | 'roles', value: any) => {
    const updated = [...editUserData.departmentRoles];
    if (field === 'roles') {
      // Handle role toggle
      const role = value;
      const currentRoles = updated[index].roles;
      if (currentRoles.includes(role)) {
        updated[index].roles = currentRoles.filter(r => r !== role);
      } else {
        updated[index].roles = [...currentRoles, role];
      }
    } else {
      updated[index][field] = value;
    }
    setEditUserData({ ...editUserData, departmentRoles: updated });
  };

  const getUserDetails = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;

    // Vice-Chairman doesn't have access to tasks, so we'll create a simplified version
    // Get user's departments (both primary and additional)
    const userDepartments: any[] = [];
    
    // Add primary department
    if (user.department) {
      userDepartments.push({
        ...user.department,
        roles: [user.role],
        isPrimary: true
      });
    }

    // Add additional departments from departmentRoles if available
    const userWithRoles = user as any;
    if (userWithRoles.departmentRoles) {
      userWithRoles.departmentRoles.forEach((deptRole: any) => {
        const dept = departments.find(d => d._id === deptRole.departmentId);
        if (dept && !userDepartments.some(ud => ud.id === dept._id)) {
          userDepartments.push({
            id: dept._id,
            name: dept.name,
            code: dept.code,
            roles: deptRole.roles,
            isPrimary: false
          });
        }
      });
    }

    // GROUP DEPARTMENTS FOR DISPLAY (Vice-Chairman version without tasks)
    const departmentsByRole = userDepartments.map(dept => ({
      ...dept,
      departmentStats: {
        userCount: users.filter(u => 
          u.department?.id === dept.id || 
          (u as any).departmentRoles?.some((dr: any) => dr.departmentId === dept.id)
        ).length,
        activeUsers: users.filter(u => 
          (u.department?.id === dept.id || 
           (u as any).departmentRoles?.some((dr: any) => dr.departmentId === dept.id)) &&
          u.lastLoginAt
        ).length
      }
    }));

    return {
      ...user,
      departments: userDepartments,
      departmentsByRole,
      stats: {
        totalDepartments: userDepartments.length,
        primaryDepartment: userDepartments.find(d => d.isPrimary)?.name || 'None'
      }
    };
  };

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, searchTerm]);

  const filteredUsers = users.filter(user => {
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesSearch = !searchTerm || user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !departmentFilter || (user.department && user.department.id === departmentFilter);
    
    return matchesRole && matchesSearch && matchesDepartment;
  });

  const getDepartmentUsers = (departmentId: string) => {
    return users.filter(user => user.department && user.department.id === departmentId);
  };

  const getDepartmentDetails = (departmentId: string) => {
    const dept = departments.find(d => d._id === departmentId);
    if (!dept) return null;
    
    const deptUsers = getDepartmentUsers(departmentId);
    
    return {
      ...dept,
      users: deptUsers,
      stats: {
        totalUsers: deptUsers.length,
        hods: deptUsers.filter(u => u.role === 'HOD').length,
        coordinators: deptUsers.filter(u => u.role === 'COORDINATOR').length,
        professors: deptUsers.filter(u => u.role === 'PROFESSOR').length,
      }
    };
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Vice Chairman Dashboard</h2>
      </div>

      {notification && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <AlertCircle className="h-4 w-4" />
          {notification.message}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="create-department">Create Department</TabsTrigger>
          <TabsTrigger value="users">All Users</TabsTrigger>
          <TabsTrigger value="create-user">Create User</TabsTrigger>
          <TabsTrigger value="admin-tasks">Administrative Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departments</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departments.filter(d => d.isActive).length}</div>
                <p className="text-xs text-muted-foreground">Under supervision</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faculty</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">Total staff</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">91%</div>
                <p className="text-xs text-muted-foreground">Overall rating</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          {selectedDepartmentId ? (
            <>
              {/* Department Detail View */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setSelectedDepartmentId(null)} className="text-blue-600">
                  ← Back to All Departments
                </Button>
                <Button onClick={() => {fetchDepartments(); fetchUsers();}} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {(() => {
                const deptDetails = getDepartmentDetails(selectedDepartmentId);
                if (!deptDetails) return <div>Department not found</div>;

                return (
                  <div className="space-y-6">
                    {/* Department Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl">{deptDetails.name}</CardTitle>
                        <CardDescription className="text-lg">
                          Code: {deptDetails.code} • {deptDetails.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{deptDetails.stats.totalUsers}</div>
                            <div className="text-sm text-muted-foreground">Total Faculty</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{deptDetails.stats.hods}</div>
                            <div className="text-sm text-muted-foreground">HODs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{deptDetails.stats.coordinators}</div>
                            <div className="text-sm text-muted-foreground">Coordinators</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{deptDetails.stats.professors}</div>
                            <div className="text-sm text-muted-foreground">Professors</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Department Users */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Department Faculty ({deptDetails.stats.totalUsers})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4">
                          {deptDetails.users.map((user) => (
                            <div 
                              key={user.id} 
                              className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => router.push(`/dashboard/users/${user.id}`)}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{user.name}</h4>
                                  <span className={`px-2 py-1 text-xs rounded ${
                                    user.role === 'HOD' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                                    user.role === 'COORDINATOR' ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.role}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                {user.phone && <p className="text-sm text-muted-foreground">Phone: {user.phone}</p>}
                                {user.lastLoginAt && (
                                  <p className="text-xs text-muted-foreground">
                                    Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="text-xs text-blue-600">
                                Click to view details →
                              </div>
                            </div>
                          ))}
                          {deptDetails.users.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">No faculty in this department</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              {/* Department List View */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">All Departments</h3>
                <Button onClick={fetchDepartments} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8">Loading departments...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {departments.map((dept) => {
                    const deptUsers = getDepartmentUsers(dept._id);
                    return (
                      <Card key={dept._id} 
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => setSelectedDepartmentId(dept._id)}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            {dept.name}
                            <span className="text-sm font-normal text-muted-foreground">({dept.code})</span>
                          </CardTitle>
                          {dept.description && (
                            <CardDescription>{dept.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Faculty: {deptUsers.length}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>HODs: {deptUsers.filter(u => u.role === 'HOD').length}</span>
                              <span>Coordinators: {deptUsers.filter(u => u.role === 'COORDINATOR').length}</span>
                              <span>Professors: {deptUsers.filter(u => u.role === 'PROFESSOR').length}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Established: {new Date(dept.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className={`inline-block px-2 py-1 text-xs rounded ${
                                dept.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {dept.isActive ? 'Active' : 'Inactive'}
                              </div>
                              <span className="text-xs text-blue-600">Click to view details →</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="create-department" className="space-y-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Create New Department</CardTitle>
              <CardDescription>
                Add a new department to the institution (Vice Chairman privileges)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Department Name *</label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({...newDepartment, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Department Code *</label>
                  <input
                    type="text"
                    value={newDepartment.code}
                    onChange={(e) => setNewDepartment({...newDepartment, code: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="e.g., CSE, EEE, ME"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({...newDepartment, description: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    rows={3}
                  />
                </div>

         

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? 'Creating...' : 'Create Department'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {selectedUserId ? (
            <>
              {/* User Detail View */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setSelectedUserId(null)} className="text-blue-600">
                  ← Back to All Users
                </Button>
                <Button onClick={() => fetchUsers()} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {(() => {
                const userDetails = getUserDetails(selectedUserId);
                if (!userDetails) return <div>User not found</div>;

                return (
                  <div className="space-y-6">
                    {/* User Header */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <User className="h-6 w-6" />
                          {userDetails.name}
                        </CardTitle>
                        <CardDescription className="text-lg">
                          {userDetails.role} • {userDetails.email}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{userDetails.stats.totalDepartments}</div>
                            <div className="text-sm text-muted-foreground">Departments</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{userDetails.departments.filter((d: any) => d.isPrimary).length}</div>
                            <div className="text-sm text-muted-foreground">Primary Roles</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* User Detail Tabs */}
                    <Tabs defaultValue="overview" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="departments">Departments</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Card>
                            <CardHeader>
                              <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div><strong>Name:</strong> {userDetails.name}</div>
                              <div><strong>Email:</strong> {userDetails.email}</div>
                              <div><strong>Role:</strong> {userDetails.role}</div>
                              {userDetails.phone && <div><strong>Phone:</strong> {userDetails.phone}</div>}
                              {userDetails.bio && <div><strong>Bio:</strong> {userDetails.bio}</div>}
                              <div><strong>Joined:</strong> {new Date(userDetails.createdAt).toLocaleDateString()}</div>
                              {userDetails.lastLoginAt && (
                                <div><strong>Last Login:</strong> {new Date(userDetails.lastLoginAt).toLocaleDateString()}</div>
                              )}
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle>Department Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>Total Departments:</span>
                                <span className="font-medium">{userDetails.stats.totalDepartments}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Primary Roles:</span>
                                <span className="font-medium text-blue-600">{userDetails.departments.filter((d: any) => d.isPrimary).length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Additional Roles:</span>
                                <span className="font-medium text-green-600">{userDetails.departments.filter((d: any) => !d.isPrimary).length}</span>
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
                                  <div><strong>Status:</strong> {dept.isPrimary ? 'Primary Department' : 'Additional Assignment'}</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              {/* User List View */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">User Management</h3>
                <div className="flex gap-2">
              <select 
                value={departmentFilter} 
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Roles</option>
                <option value="HOD">Head of Department</option>
                <option value="PROFESSOR">Professor</option>
                <option value="COORDINATOR">Coordinator</option>
              </select>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border rounded-md"
              />
              <Button onClick={fetchUsers} variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {usersLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((user) => (
                <Card 
                  key={user.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 
                            className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            {user.name}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded ${
                            user.role === 'HOD' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'PROFESSOR' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'COORDINATOR' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                          {(user as any).departmentRoles && (user as any).departmentRoles.length > 0 && (
                            <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">
                              Multi
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        {/* Show Primary Department */}
                        {user.department && (
                          <div className="text-sm">
                            <span className="font-medium text-blue-600">Primary:</span> {user.department.name} ({user.department.code}) - {user.role}
                          </div>
                        )}
                        
                        {/* Show Additional Department Roles */}
                        {(user as any).departmentRoles && (user as any).departmentRoles.length > 0 && (
                          <div className="text-sm space-y-1">
                            <span className="font-medium text-green-600">Additional Assignments:</span>
                            {(user as any).departmentRoles.map((deptRole: any, index: number) => {
                              const dept = departments.find(d => d._id === deptRole.departmentId);
                              return dept ? (
                                <div key={index} className="text-xs text-muted-foreground ml-2">
                                  • {dept.name} ({dept.code}) - {deptRole.roles.join(', ')}
                                </div>
                              ) : null;
                            })}
                          </div>
                        )}
                        {user.supervisor && (
                          <p className="text-sm text-muted-foreground">
                            Supervisor: {user.supervisor.name} ({user.supervisor.role})
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                        {user.lastLoginAt && (
                          <p className="text-xs text-muted-foreground">
                            Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-blue-600 mr-auto">Click to view details →</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(user);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
            </>
          )}
        </TabsContent>

        <TabsContent value="create-user" className="space-y-4">
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                Add a new user to the system (Vice Chairman privileges)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Role *</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="HOD">Head of Department</option>
                    <option value="COORDINATOR">Coordinator</option>
                    <option value="PROFESSOR">Professor</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Department *</label>
                  <select
                    value={newUser.departmentId}
                    onChange={(e) => setNewUser({...newUser, departmentId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" disabled={creatingUser} className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {creatingUser ? 'Creating...' : 'Create User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin-tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Administrative Tasks</CardTitle>
              <CardDescription>
                High-priority items requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Budget Approval Request</p>
                    <p className="text-xs text-muted-foreground">Engineering Department - Equipment Purchase</p>
                  </div>
                  <div className="text-xs text-red-600 font-medium">Urgent</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Faculty Promotion Review</p>
                    <p className="text-xs text-muted-foreground">Dr. Sarah Johnson - Associate Professor</p>
                  </div>
                  <div className="text-xs text-orange-600 font-medium">This week</div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">New Course Approval</p>
                    <p className="text-xs text-muted-foreground">Computer Science - AI Ethics</p>
                  </div>
                  <div className="text-xs text-blue-600 font-medium">Review pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
                ✕
              </Button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Full Name *</label>
                  <input
                    type="text"
                    value={editUserData.name}
                    onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <input
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  />
                </div>
              </div>

              {/* Primary Role & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Primary Role *</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({...editUserData, role: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="HOD">Head of Department</option>
                    <option value="COORDINATOR">Coordinator</option>
                    <option value="PROFESSOR">Professor</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Primary Department *</label>
                  <select
                    value={editUserData.departmentId}
                    onChange={(e) => setEditUserData({...editUserData, departmentId: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Department Roles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Additional Department Roles</label>
                  <Button type="button" variant="outline" size="sm" onClick={addDepartmentRole}>
                    + Add Role
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {editUserData.departmentRoles.map((deptRole, index) => (
                    <div key={index} className="border rounded-md p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Department Role #{index + 1}</h4>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeDepartmentRole(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Department</label>
                          <select
                            value={deptRole.departmentId}
                            onChange={(e) => updateDepartmentRole(index, 'departmentId', e.target.value)}
                            className="w-full mt-1 px-3 py-2 border rounded-md"
                          >
                            <option value="">Select Department</option>
                            {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name} ({dept.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Roles</label>
                          <div className="mt-1 space-y-1">
                            {['HOD', 'COORDINATOR', 'PROFESSOR'].map((role) => (
                              <label key={role} className="flex items-center space-x-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={deptRole.roles.includes(role)}
                                  onChange={() => updateDepartmentRole(index, 'roles', role)}
                                  className="rounded"
                                />
                                <span>{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {editUserData.departmentRoles.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No additional roles assigned. Click "Add Role" to assign roles in other departments.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingUser}>
                  {updatingUser ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}