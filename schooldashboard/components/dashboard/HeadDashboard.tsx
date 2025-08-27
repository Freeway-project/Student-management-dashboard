'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import CreateUserForm from './CreateUserForm';

export default function HeadDashboard() {
  const [showCreateUser, setShowCreateUser] = useState(false);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Head Dashboard</h2>
        <Button onClick={() => setShowCreateUser(!showCreateUser)}>
          <Plus className="mr-2 h-4 w-4" />
          {showCreateUser ? 'Hide Form' : 'Create Student'}
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateUser && (
        <div className="mb-6">
          <CreateUserForm
            allowedRoles={['STUDENT']}
            onUserCreated={() => setShowCreateUser(false)}
            title="Create New Student"
            description="Add a new student to your department"
          />
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department Faculty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Teaching staff
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Department Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Overall rating
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues Reported</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              Items requiring your review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Course Curriculum Update</p>
                  <p className="text-xs text-muted-foreground">Mathematics Department</p>
                </div>
                <div className="text-xs text-muted-foreground">Urgent</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Faculty Leave Request</p>
                  <p className="text-xs text-muted-foreground">Dr. Smith</p>
                </div>
                <div className="text-xs text-muted-foreground">2 days ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Department Overview</CardTitle>
            <CardDescription>
              Key metrics for your department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Student Enrollment</p>
                  <p className="text-xs text-muted-foreground">Active students</p>
                </div>
                <div className="text-sm font-bold">456</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Course Completion Rate</p>
                  <p className="text-xs text-muted-foreground">This semester</p>
                </div>
                <div className="text-sm font-bold">92%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}