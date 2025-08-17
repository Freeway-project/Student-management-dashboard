"use client";
import { useState, useEffect } from "react";
import StudentDashboard from "@/components/StudentDashboard";
import Roles from "@/models/Membership";

export default function Dashboard() {
  const [membership, setMembership] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/memberships");
      if (res.ok) {
        const data = await res.json();
        setMembership(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (membership?.role !== Roles.STUDENT) {
      async function fetchSubmissions() {
        const res = await fetch("/api/submissions");
        if (res.ok) {
          const data = await res.json();
          setSubmissions(data);
        }
      }
      fetchSubmissions();
    }
  }, [membership]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!membership) {
    return <div>Not signed in</div>;
  }

  if (membership?.role === Roles.STUDENT) {
    return <StudentDashboard />;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Visible Submissions</h1>
      <ul className="space-y-2">
        {submissions.map((x: any) => (
          <li key={x._id} className="border p-3 rounded">
            <div className="font-medium">{x.title}</div>
            <div className="text-sm text-muted-foreground">
              {String(x.orgUnitId)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}