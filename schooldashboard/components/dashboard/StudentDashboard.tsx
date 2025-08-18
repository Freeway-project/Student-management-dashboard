'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Calendar, Clock, User } from 'lucide-react';
import StudentProfile from './StudentProfile';

export default function StudentDashboard() {
  const [currentView, setCurrentView] = useState('dashboard');

  if (currentView === 'profile') {
    return <StudentProfile onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Student Dashboard</h2>
        <Button onClick={() => setCurrentView('profile')} variant="outline">
          <User className="h-4 w-4 mr-2" />
          My Profile
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-xs text-muted-foreground">
              This semester
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3 due this week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Next week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest academic updates
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Assignment submitted: Mathematics Quiz
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Grade received: Science Lab Report - A
                  </p>
                  <p className="text-sm text-muted-foreground">
                    5 hours ago
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    New assignment posted: English Essay
                  </p>
                  <p className="text-sm text-muted-foreground">
                    1 day ago
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>This Week</CardTitle>
            <CardDescription>
              Your upcoming schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium">Mon</div>
                <div className="flex-1">
                  <p className="text-sm">Math Test</p>
                  <p className="text-xs text-muted-foreground">10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium">Wed</div>
                <div className="flex-1">
                  <p className="text-sm">Science Lab</p>
                  <p className="text-xs text-muted-foreground">2:00 PM</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium">Fri</div>
                <div className="flex-1">
                  <p className="text-sm">English Essay Due</p>
                  <p className="text-xs text-muted-foreground">11:59 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}