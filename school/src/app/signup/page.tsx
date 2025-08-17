// src/app/signup/page.tsx
"use client";
import { useState } from "react";
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    // Call your signup API route (to be implemented)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (res.ok) {
      setSuccess("Account created! You can now log in.");
    } else {
      setError("Signup failed. Try a different email.");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-24">
      <h1 className="text-xl font-semibold mb-4">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="name"
          required
        />
        <input
          className="w-full border p-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="email"
          type="email"
          required
        />
        <input
          className="w-full border p-2 rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          type="password"
          placeholder="password"
          required
        />
        <button className="w-full border p-2 rounded bg-blue-600 text-white">Sign up</button>
      </form>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">{success}</div>}
      <div className="mt-4 text-center">
        <Link href="/login" className="text-blue-600 hover:underline">Already have an account? Log in</Link>
      </div>
    </div>
  );
}
