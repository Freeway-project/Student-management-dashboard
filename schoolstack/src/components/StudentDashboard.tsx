'use client';
import { useState, useEffect } from 'react';

export default function StudentDashboard() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    async function fetchUserData() {
      const res = await fetch('/api/student/profile');
      if (res.ok) {
        const data = await res.json();
        setName(data.name || '');
        setStudentId(data.studentId || '');
        setAge(data.age || '');
        setBio(data.bio || '');
      }
    }
    fetchUserData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/student/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, studentId, age: parseInt(age), bio }),
    });
    if (res.ok) {
      alert('Profile updated successfully!');
    } else {
      alert('Failed to update profile.');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Student Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          className="w-full border p-2 rounded"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Student ID"
        />
        <input
          className="w-full border p-2 rounded"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          type="number"
          placeholder="Age"
        />
        <textarea
          className="w-full border p-2 rounded"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Bio"
        />
        <button className="w-full border p-2 rounded bg-black text-white">
          Submit
        </button>
      </form>
    </div>
  );
}
