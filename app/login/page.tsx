'use client';

import AuthForm from '@/components/AuthForm';
import axios from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { setToken } from '@/lib/auth';

export default function Login() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (email: string, password: string) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
        <AuthForm type="login" onSubmit={handleSubmit} error={error} />
        <p className="mt-4 text-center">
          <a href="/signup" className="text-primary hover:underline">
            Don’t have an account? Sign up
          </a>
        </p>
        <p className="mt-2 text-center">
          <a href={process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL} className="text-primary hover:underline">
            Login with Google
          </a>
        </p>
      </div>
    </div>
  );
}