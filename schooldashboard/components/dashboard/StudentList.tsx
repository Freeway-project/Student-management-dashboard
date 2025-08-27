'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Eye, RefreshCw } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  role: string;
  otherInfo?: {
    studentId?: string;
  };
}

interface StudentListProps {
  students: Student[];
  loading: boolean;
  onRefresh: () => void;
  onViewStudent: (student: Student) => void;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
}

export default function StudentList({
  students,
  loading,
  onRefresh,
  onViewStudent,
  page,
  pageSize,
  setPage
}: StudentListProps) {
  const totalPages = Math.ceil(students.length / pageSize);
  const paginatedStudents = students.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Student List</CardTitle>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>Students assigned to your classes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading && <p>Loading students...</p>}
          {!loading && students.length === 0 && (
            <p className="text-muted-foreground">No students assigned yet.</p>
          )}
          {paginatedStudents.map((student) => (
            <div
              key={student._id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{student.name}</h4>
                <p className="text-sm text-muted-foreground">{student.email}</p>
                {student.otherInfo?.studentId && (
                  <p className="text-sm text-muted-foreground">
                    ID: {student.otherInfo.studentId}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewStudent(student)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="mx-4">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
