'use client';

import ProtectedRoute from '@/components/ProtectedRoute';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <h1 className="text-2xl font-bold text-primary">Logged in successfully</h1>
      </div>
    </ProtectedRoute>
  );
}