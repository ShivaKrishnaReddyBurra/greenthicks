'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getToken, isAuthenticated } from '@/lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  return isAuthenticated() ? <>{children}</> : null;
}