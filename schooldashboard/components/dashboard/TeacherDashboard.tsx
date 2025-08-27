'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, FileCheck, Calendar, Eye, Plus } from 'lucide-react';
import CreateUserForm from './CreateUserForm';

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  otherInfo?: {
    studentId?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    additionalNotes?: string;
  };
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    if (user) {
      loadStudents();
    }
  }, [user]);

  const loadStudents = async () => {
    try {
      const response = await fetch(`/api/hierarchy/users?email=${user?.email}&role=STUDENT`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  if (currentView === 'students') {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">My Students</h2>
          <Button onClick={() => setCurrentView('dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              Students assigned to your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.length === 0 ? (
                <p className="text-muted-foreground">No students assigned yet.</p>
              ) : (
                students.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-sm text-muted-foreground">{student.email}</p>
                      {student.otherInfo?.studentId && (
                        <p className="text-sm text-muted-foreground">ID: {student.otherInfo.studentId}</p>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        {selectedStudent && (
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>
                Detailed information for {selectedStudent.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <p><strong>Name:</strong> {selectedStudent.name}</p>
                  <p><strong>Email:</strong> {selectedStudent.email}</p>
                  <p><strong>Role:</strong> {selectedStudent.role}</p>
                  {selectedStudent.otherInfo?.studentId && (
                    <p><strong>Student ID:</strong> {selectedStudent.otherInfo.studentId}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  {selectedStudent.otherInfo?.phone && (
                    <p><strong>Phone:</strong> {selectedStudent.otherInfo.phone}</p>
                  )}
                  {selectedStudent.otherInfo?.address && (
                    <p><strong>Address:</strong> {selectedStudent.otherInfo.address}</p>
                  )}
                  {selectedStudent.otherInfo?.emergencyContact && (
                    <p><strong>Emergency Contact:</strong> {selectedStudent.otherInfo.emergencyContact}</p>
                  )}
                </div>
              </div>
              {selectedStudent.otherInfo?.additionalNotes && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Additional Notes</h4>
                  <p className="text-sm">{selectedStudent.otherInfo.additionalNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateUser(!showCreateUser)}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateUser ? 'Hide Form' : 'Create Student'}
          </Button>
          <Button onClick={() => setCurrentView('students')} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            View My Students
          </Button>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateUser && (
        <div className="mb-6">
          <CreateUserForm
            allowedRoles={['STUDENT']}
            onUserCreated={() => {
              setShowCreateUser(false);
              loadStudents(); // Refresh student list
            }}
            title="Create New Student"
            description="Add a new student to your class"
          />
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              Across all classes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Teaching</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">
              This semester
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Assignments to grade
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Teaching schedule
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>
              Latest student work to review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mathematics Quiz - Class A</p>
                  <p className="text-xs text-muted-foreground">28 submissions</p>
                </div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Science Lab Report - Class B</p>
                  <p className="text-xs text-muted-foreground">15 submissions</p>
                </div>
                <div className="text-xs text-muted-foreground">5 hours ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>
              Your classes for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Mathematics - Grade 10A</p>
                  <p className="text-xs text-muted-foreground">Room 201</p>
                </div>
                <div className="text-xs text-muted-foreground">9:00 AM</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Advanced Math - Grade 11B</p>
                  <p className="text-xs text-muted-foreground">Room 201</p>
                </div>
                <div className="text-xs text-muted-foreground">11:00 AM</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}