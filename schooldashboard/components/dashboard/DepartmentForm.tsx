import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DepartmentFormProps {
  onCreated?: (department: any) => void;
}

export default function DepartmentForm({ onCreated }: DepartmentFormProps) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    email: '',
    establishedDate: '',
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Department created successfully!');
        setForm({ name: '', code: '', description: '', email: '', establishedDate: '', isActive: true });
        if (onCreated) onCreated(data);
      } else {
        setMessage(data.error || 'Failed to create department');
      }
    } catch (err) {
      setMessage('Error creating department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Create Department</CardTitle>
        <CardDescription>Only Chair/VC can create new departments.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Department Name" className="w-full border rounded px-3 py-2" required />
          <input name="code" value={form.code} onChange={handleChange} placeholder="Code" className="w-full border rounded px-3 py-2" required />


          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="w-full border rounded px-3 py-2" />
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating...' : 'Create Department'}</Button>
          {message && <div className="text-sm mt-2 text-center text-muted-foreground">{message}</div>}
        </form>
      </CardContent>
    </Card>
  );
}
