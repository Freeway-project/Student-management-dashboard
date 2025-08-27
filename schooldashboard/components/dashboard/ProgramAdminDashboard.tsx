'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus,
  Search,
  Mail,
  Phone,
  Crown,
  RefreshCw
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // ...existing code...
  department: {
    id: string;
    name: string;
    code: string;
  } | null;
  supervisor: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdBy: {
    name: string;
    email: string;
  } | null;
  lastLoginAt: string | null;
  createdAt: string;
  phone?: string;
  bio?: string;
  children?: User[];
}


interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  roleCount: { [key: string]: number };
  departmentCount: { [key: string]: number };
  recentLogins: User[];
}

export default function ProgramAdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  // ...existing code...
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    departmentId: ''
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  useEffect(() => {
    const delayedFetch = setTimeout(() => {
      fetchHierarchyData();
    }, 300); // Debounce search
    
    return () => clearTimeout(delayedFetch);
  }, [searchTerm, roleFilter, departmentFilter]);

  const fetchHierarchyData = async () => {
    try {
      setError('');
      
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('faculty_user') || '{}');
      if (!currentUser.id) {
        setError('401: Authentication required - Please log in');
        return;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);
  // Removed status filter from API params
      if (departmentFilter) params.append('department', departmentFilter);
      
      const queryString = params.toString();
      const url = `/api/users/all-users${queryString ? `?${queryString}` : ''}`;
      
      console.log('🔄 Fetching from:', url);
      const response = await fetch(url, {
        headers: {
          'x-current-user': JSON.stringify(currentUser)
        }
      });
      console.log('📡 Response:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setStats(data.stats);
        setError('');
      } else {
        const errorData = await response.json();
        setError(`${response.status}: ${errorData.error || 'Unknown error'}`);
        console.error('❌ API Error:', errorData);
      }
    } catch (error) {
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    setMessage('');

    try {
      // Get current user from localStorage
      const currentUser = JSON.parse(localStorage.getItem('faculty_user') || '{}');
      if (!currentUser.id) {
        setMessage('Error: Authentication required - Please log in');
        return;
      }

      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-current-user': JSON.stringify(currentUser)
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`User ${data.name} created successfully with role ${data.role}`);
        setFormData({ name: '', email: '', password: '', role: '', departmentId: '' });
        fetchHierarchyData(); // Refresh user list
      } else {
        setMessage(`Error: ${data.message || 'Failed to create user'}`);
      }
    } catch (error) {
      setMessage('Error: Failed to create user');
    } finally {
      setIsCreatingUser(false);
    }
  };


  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'PROGRAM_ADMIN':
      case 'COMPANY_ADMIN':
        return 'destructive';
      case 'CHAIRMAN':
      case 'VICE_CHAIRMAN':
        return 'default';
      case 'HOD':
        return 'secondary';
      case 'COORDINATOR':
        return 'outline';
      case 'PROFESSOR':
        return 'default';
      default:
        return 'secondary';
    }
  };


  const filteredUsers = users; // Filtering is now done server-side

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-lg text-red-600 mb-4">❌ Error Loading Users</div>
          <div className="text-sm text-gray-500 mb-4">{error}</div>
          <Button onClick={fetchHierarchyData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <div className="mt-4 text-xs text-gray-400">
            Debug: Visit <a href="/api/debug/current-user" className="text-blue-500 underline" target="_blank">/api/debug/current-user</a> to check your authentication
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Program Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Complete system overview and user hierarchy management
          </p>
        </div>

      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Professors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.roleCount.PROFESSOR || 0}</div>
              <p className="text-xs text-muted-foreground">
                Teaching faculty
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.roleCount.PROGRAM_ADMIN || 0) + (stats.roleCount.COMPANY_ADMIN || 0) + (stats.roleCount.CHAIRMAN || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Leadership roles
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">View All Users</TabsTrigger>
          <TabsTrigger value="create">Create User</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete list of all system users
              </CardDescription>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <select 
                  className="p-2 border rounded-md text-sm"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="PROGRAM_ADMIN">Program Admin</option>
                  <option value="COMPANY_ADMIN">Company Admin</option>
                  <option value="CHAIRMAN">Chairman</option>
                  <option value="VICE_CHAIRMAN">Vice Chairman</option>
                  <option value="HOD">HOD</option>
                  <option value="COORDINATOR">Coordinator</option>
                  <option value="PROFESSOR">Professor</option>

                </select>
                
                <select 
                  className="p-2 border rounded-md text-sm"
                  // Removed status filter select
                >
                  {/* Removed status options */}
                </select>
                
                <select 
                  className="p-2 border rounded-md text-sm"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="">All Departments</option>
                  <option value="CS">Computer Science</option>
                  <option value="EE">Electrical Engineering</option>
                  <option value="ME">Mechanical Engineering</option>
                </select>
                
                {(searchTerm || roleFilter || departmentFilter) && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setRoleFilter('');
                      // Removed status filter reset
                      setDepartmentFilter('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {user.role === 'PROGRAM_ADMIN' && <Crown className="h-4 w-4 text-yellow-500" />}
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {user.email}
                            {user.phone && (
                              <>
                                <Phone className="h-3 w-3 ml-2" />
                                {user.phone}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                        {/* Removed user status badge */}
                        {user.department && (
                          <Badge variant="outline">
                            {user.department.code}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {user.lastLoginAt ? (
                        <>Last login: {new Date(user.lastLoginAt).toLocaleDateString()}</>
                      ) : (
                        'Never logged in'
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
                <CardDescription>
                  Add a new user to the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                    >
                      <option value="">Select a role</option>
                      <option value="PROGRAM_ADMIN">Program Admin</option>
                      <option value="COMPANY_ADMIN">Company Admin</option>
                      <option value="CHAIRMAN">Chairman</option>
                      <option value="VICE_CHAIRMAN">Vice Chairman</option>
                      <option value="HOD">HOD</option>
                      <option value="COORDINATOR">Coordinator</option>
                      <option value="PROFESSOR">Professor</option>
    
                    </select>
                  </div>
                  
                  <Button type="submit" disabled={isCreatingUser} className="w-full">
                    {isCreatingUser ? 'Creating...' : 'Create User'}
                  </Button>
                  
                  {message && (
                    <div className={`text-sm p-2 rounded ${message.startsWith('Error') ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                      {message}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}