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

  // Test accounts from seed data (updated with new simple credentials)
  const testAccounts = [
    { email: 'admin@gmail.com', role: 'PROGRAM_ADMIN', name: 'Program Admin', dept: '' },
    { email: 'chair@gmail.com', role: 'CHAIRMAN', name: 'Chairman', dept: '' },
    { email: 'vice@gmail.com', role: 'VICE_CHAIRMAN', name: 'Vice Chairman', dept: '' },
    
    { email: 'cshod@gmail.com', role: 'HOD', name: 'CS HOD', dept: 'CS' },
    { email: 'mathhod@gmail.com', role: 'HOD', name: 'Math HOD', dept: 'MATH' },
    { email: 'multi@gmail.com', role: 'HOD', name: 'Multi-Dept HOD', dept: 'BCA/BTECH/CS', isMulti: true },
    
    { email: 'cscoord@gmail.com', role: 'COORDINATOR', name: 'CS Coordinator', dept: 'CS' },
    { email: 'csprof@gmail.com', role: 'PROFESSOR', name: 'CS Professor', dept: 'CS' },
    { email: 'mathprof@gmail.com', role: 'PROFESSOR', name: 'Math Professor', dept: 'MATH' },
  ];

  const quickLogin = async (email: string, role: string) => {
    setIsLoading(true);
    setLoadingRole(role);
    try {
      const result = await login(email, '000000');
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
                <div className="flex items-center gap-1">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                    {user.role}
                  </Badge>
                  {(user as any).departmentRoles && (user as any).departmentRoles.length > 1 && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                      Multi
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {user.email}
                {user.department && (
                  <span className="ml-2">• {user.department.name}</span>
                )}
              </div>
              {(user as any).departmentRoles && (user as any).departmentRoles.length > 1 && (
                <div className="text-xs text-blue-600 mt-1">
                  Multi-dept: {(user as any).allDepartments?.length || (user as any).departmentRoles?.length} departments
                </div>
              )}
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
                  className={`h-10 text-xs justify-between p-2 hover:bg-orange-100 ${
                    account.isMulti ? 'border border-blue-200 bg-blue-50 hover:bg-blue-100' : ''
                  }`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(account.role)} className="text-xs">
                        {account.role === 'VICE_CHAIRMAN' ? 'VC' : 
                         account.role === 'PROGRAM_ADMIN' ? 'PA' :
                         account.role === 'COMPANY_ADMIN' ? 'CA' :
                         account.role.slice(0, 4)}
                      </Badge>
                      <span className="font-medium">{account.name}</span>
                      {account.isMulti && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                          Multi
                        </Badge>
                      )}
                    </div>
                    {account.dept && (
                      <div className="text-xs text-gray-500">
                        {account.isMulti ? `${account.dept}` : `Dept: ${account.dept}`}
                      </div>
                    )}
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
            🔐 Password: <strong>000000</strong> (all accounts)
            <br />⚡ Click any role above to login instantly
            <br />🔄 <span className="text-blue-600 font-medium">Multi</span> = Multi-department user
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
            {(user as any).departmentRoles && (user as any).departmentRoles.length > 1 && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                Multi
              </Badge>
            )}
            <span className="text-sm font-medium text-orange-800 truncate">
              {user.name}
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}