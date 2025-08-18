'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { User, Save, ArrowLeft } from 'lucide-react';

interface StudentProfileProps {
  onBack?: () => void;
}

export default function StudentProfile({ onBack }: StudentProfileProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    otherInfo: {
      studentId: '',
      phone: '',
      address: '',
      emergencyContact: '',
      additionalNotes: ''
    }
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/student/profile?email=${user?.email}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          otherInfo: {
            studentId: data.otherInfo?.studentId || '',
            phone: data.otherInfo?.phone || '',
            address: data.otherInfo?.address || '',
            emergencyContact: data.otherInfo?.emergencyContact || '',
            additionalNotes: data.otherInfo?.additionalNotes || ''
          }
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.email,
          name: formData.name,
          otherInfo: formData.otherInfo
        }),
      });

      if (response.ok) {
        setMessage('Profile updated successfully!');
      } else {
        const data = await response.json();
        setMessage(`Error: ${data.error || 'Failed to update profile'}`);
      }
    } catch (error) {
      setMessage('Error: Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtherInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      otherInfo: {
        ...prev.otherInfo,
        [field]: value
      }
    }));
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        {onBack && (
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
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
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email (Read-only)</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  value={formData.otherInfo.studentId}
                  onChange={(e) => handleOtherInfoChange('studentId', e.target.value)}
                  placeholder="Enter your student ID"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.otherInfo.phone}
                  onChange={(e) => handleOtherInfoChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.otherInfo.address}
                  onChange={(e) => handleOtherInfoChange('address', e.target.value)}
                  placeholder="Enter your address"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  type="text"
                  value={formData.otherInfo.emergencyContact}
                  onChange={(e) => handleOtherInfoChange('emergencyContact', e.target.value)}
                  placeholder="Emergency contact name and phone"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={formData.otherInfo.additionalNotes}
                  onChange={(e) => handleOtherInfoChange('additionalNotes', e.target.value)}
                  placeholder="Any additional information"
                  className="min-h-[80px]"
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Profile'}
              </Button>
              
              {message && (
                <div className={`text-sm ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>
              Overview of your current profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Account Details</h4>
                <p className="text-sm text-muted-foreground">Role: Student</p>
                <p className="text-sm text-muted-foreground">Email: {user?.email}</p>
              </div>
              
              {formData.otherInfo.studentId && (
                <div>
                  <h4 className="font-medium">Student ID</h4>
                  <p className="text-sm text-muted-foreground">{formData.otherInfo.studentId}</p>
                </div>
              )}
              
              {formData.otherInfo.phone && (
                <div>
                  <h4 className="font-medium">Contact</h4>
                  <p className="text-sm text-muted-foreground">{formData.otherInfo.phone}</p>
                </div>
              )}
              
              {formData.otherInfo.emergencyContact && (
                <div>
                  <h4 className="font-medium">Emergency Contact</h4>
                  <p className="text-sm text-muted-foreground">{formData.otherInfo.emergencyContact}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}