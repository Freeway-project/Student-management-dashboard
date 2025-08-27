'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface CreateUserFormProps {
  allowedRoles: string[];
  onUserCreated?: () => void;
  title?: string;
  description?: string;
}

export default function CreateUserForm({ 
  allowedRoles, 
  onUserCreated, 
  title = "Create New User",
  description = "Add a new user to the system"
}: CreateUserFormProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: allowedRoles[0] || ''
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
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
        setFormData({ name: '', email: '', password: '', role: allowedRoles[0] || '' });
        onUserCreated?.();
      } else {
        setMessage(`Error: ${data.message || 'Failed to create user'}`);
      }
    } catch (error) {
      setMessage('Error: Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  // Don't show form if user doesn't have permission
  const canCreateUsers = user && ['PROGRAM_ADMIN', 'HOD', 'PROFESSOR'].includes(user.role);
  if (!canCreateUsers) {
    return null;
  }

  const roleDisplayNames: { [key: string]: string } = {
    'STUDENT': 'Student',
    'PROFESSOR': 'Professor',
    'COORDINATOR': 'Coordinator',
    'HOD': 'Head of Department',
    'VICE_CHAIRMAN': 'Vice Chairman',
    'CHAIRMAN': 'Chairman',
    'COMPANY_ADMIN': 'Company Admin',
    'PROGRAM_ADMIN': 'Program Admin'
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isCreating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isCreating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isCreating}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select 
              id="role"
              className="w-full p-2 border rounded-md"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
              disabled={isCreating}
            >
              {allowedRoles.map(role => (
                <option key={role} value={role}>
                  {roleDisplayNames[role] || role}
                </option>
              ))}
            </select>
          </div>
          
          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating ? 'Creating...' : 'Create User'}
          </Button>
          
          {message && (
            <div className={`text-sm p-2 rounded ${
              message.startsWith('Error') 
                ? 'text-red-600 bg-red-50' 
                : 'text-green-600 bg-green-50'
            }`}>
              {message}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}