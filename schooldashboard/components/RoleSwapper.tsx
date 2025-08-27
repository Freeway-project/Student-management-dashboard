'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, User, Shield, ChevronUp, ChevronDown } from 'lucide-react';

export default function RoleSwapper() {
  const { user, login, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Only show in development or for admin users
  // useEffect(() => {
  //   const isDev = process.env.NODE_ENV === 'development';
  //   const isAdmin = user?.role === 'PROGRAM_ADMIN' || user?.role === 'COMPANY_ADMIN';
  //   setIsVisible(isDev || isAdmin);
  // }, [user]);

  // Test accounts from seed data
  const testAccounts = [
    { email: 'admin@university.edu', role: 'PROGRAM_ADMIN', name: 'Program Admin' },

    { email: 'chairman@university.edu', role: 'CHAIRMAN', name: 'Chairman' },
    { email: 'vice.chairman@university.edu', role: 'VICE_CHAIRMAN', name: 'Vice Chairman' },
    { email: 'hod.cs@university.edu', role: 'HOD', name: 'HOD CS' },
    { email: 'hod.ee@university.edu', role: 'HOD', name: 'HOD EE' },
    { email: 'coordinator.cs@university.edu', role: 'COORDINATOR', name: 'Coordinator CS' },
    { email: 'coordinator.ee@university.edu', role: 'COORDINATOR', name: 'Coordinator EE' },
    { email: 'prof.cs1@university.edu', role: 'PROFESSOR', name: 'Prof CS1' },
    { email: 'prof.cs2@university.edu', role: 'PROFESSOR', name: 'Prof CS2' },
    { email: 'prof.ee1@university.edu', role: 'PROFESSOR', name: 'Prof EE1' },
    { email: 'prof.ee2@university.edu', role: 'PROFESSOR', name: 'Prof EE2' },
  ];

  const quickLogin = async (email: string, role: string) => {
    setIsLoading(true);
    setLoadingRole(role);
    try {
      const result = await login(email, 'password123');
      if (result.success) {
        // User state automatically updated via context
      } else {
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
      setLoadingRole('');
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

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 shadow-lg border-orange-200 bg-orange-50 transition-all duration-300 ${isCollapsed ? 'w-64' : 'w-80'}`}>
      <CardHeader 
        className="pb-2 cursor-pointer hover:bg-orange-100 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <CardTitle className="flex items-center justify-between text-sm text-orange-800">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role Swapper
            <Badge variant="outline" className="text-xs">
              DEV
            </Badge>
          </div>
          {isCollapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent className="space-y-3">
          {/* Current User Info */}
          {user && (
            <div className="p-2 bg-white rounded border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                  {user.role}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1">{user.email}</div>
            </div>
          )}

          {/* Quick Login Buttons */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">
              Quick Login as:
            </div>
            
            <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto">
              {testAccounts.map((account) => (
                <Button
                  key={account.email}
                  size="sm"
                  variant="ghost"
                  onClick={() => quickLogin(account.email, account.role)}
                  disabled={isLoading}
                  className="h-8 text-xs justify-between p-2 hover:bg-orange-100"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleBadgeVariant(account.role)} className="text-xs">
                      {account.role === 'VICE_CHAIRMAN' ? 'VC' : 
                       account.role === 'PROGRAM_ADMIN' ? 'PA' :
                       account.role === 'COMPANY_ADMIN' ? 'CA' :
                       account.role.slice(0, 4)}
                    </Badge>
                    <span>{account.name}</span>
                  </div>
                  {loadingRole === account.role && isLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : null}
                </Button>
              ))}
            </div>
          </div>

          {/* Quick Info */}
          <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded border border-orange-200">
            🔐 Password: <strong>faculty123</strong> (all accounts)
            <br />⚡ Click any role above to login instantly
          </div>
        </CardContent>
      )}
      
      {/* Collapsed state - show current user */}
      {isCollapsed && user && (
        <CardContent className="py-2">
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
              {user.role === 'VICE_CHAIRMAN' ? 'VC' : 
               user.role === 'PROGRAM_ADMIN' ? 'PA' :
               user.role === 'COMPANY_ADMIN' ? 'CA' :
               user.role.slice(0, 4)}
            </Badge>
            <span className="text-sm font-medium text-orange-800 truncate">
              {user.name}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}