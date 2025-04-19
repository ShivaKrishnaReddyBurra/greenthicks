'use client';

import AuthForm from '@/components/AuthForm';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Signup() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await axios.post('/api/auth/signup', { email, password });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        <AuthForm type="signup" onSubmit={handleSubmit} error={error} />
        <p className="mt-4 text-center">
          <a href="/login" className="text-primary hover:underline">
            Already have an account? Login
          </a>
        </p>
        <p className="mt-2 text-center">
          <a href={process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL} className="text-primary hover:underline">
            Sign up with Google
          </a>
        </p>
      </div>
    </div>
  );
}