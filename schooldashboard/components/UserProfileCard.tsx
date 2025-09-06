import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar } from 'lucide-react';

interface UserProfileCardProps {
  user: {
    name: string;
    email: string;
    role: string;
    phone?: string;
    createdAt: string;
    departmentRoles?: Array<{ departmentId: string; role: string }>;
  };
  getRoleColor: (role: string) => string;
}

export default function UserProfileCard({ user, getRoleColor }: UserProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription className="text-lg flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
            {user.departmentRoles && user.departmentRoles.length > 0 && (
              <Badge variant="outline">Multi-Department</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {user.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
