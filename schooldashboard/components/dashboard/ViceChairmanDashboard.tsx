'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Building, Users, AlertCircle, FileText, TrendingUp, Filter, UserPlus } from 'lucide-react';
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

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

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Department Overview</h3>
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
                  <Card key={dept._id}>
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
                        <p className="text-sm font-medium">Users: {deptUsers.length}</p>
                        <p className="text-sm text-muted-foreground">
                          Established: {new Date(dept.createdAt).toLocaleDateString()}
                        </p>
                        <div className={`inline-block px-2 py-1 text-xs rounded ${
                          dept.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
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
                <Card key={user.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
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
                        {user.department && (
                          <p className="text-sm text-muted-foreground">
                            Department: {user.department.name} ({user.department.code})
                          </p>
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
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
    </div>
  );
}