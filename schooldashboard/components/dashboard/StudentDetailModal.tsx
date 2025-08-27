'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog';
import { Button } from '@/components/ui/button';

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

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
}

export default function StudentDetailModal({
  student,
  onClose
}: StudentDetailModalProps) {
  if (!student) {
    return null;
  }

  return (
    <Dialog open={!!student} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Detailed information for {student.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <h4 className="font-medium mb-2">Basic Information</h4>
            <p>
              <strong>Name:</strong> {student.name}
            </p>
            <p>
              <strong>Email:</strong> {student.email}
            </p>
            <p>
              <strong>Role:</strong> {student.role}
            </p>
            {student.otherInfo?.studentId && (
              <p>
                <strong>Student ID:</strong> {student.otherInfo.studentId}
              </p>
            )}
          </div>
          <div>
            <h4 className="font-medium mb-2">Contact Information</h4>
            {student.otherInfo?.phone && (
              <p>
                <strong>Phone:</strong> {student.otherInfo.phone}
              </p>
            )}
            {student.otherInfo?.address && (
              <p>
                <strong>Address:</strong> {student.otherInfo.address}
              </p>
            )}
            {student.otherInfo?.emergencyContact && (
              <p>
                <strong>Emergency Contact:</strong>{' '}
                {student.otherInfo.emergencyContact}
              </p>
            )}
          </div>
          {student.otherInfo?.additionalNotes && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Additional Notes</h4>
              <p className="text-sm">{student.otherInfo.additionalNotes}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
