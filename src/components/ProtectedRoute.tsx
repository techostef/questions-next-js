'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { push } = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      push(`/?path=${pathname}`);
    }
  }, [isAuthenticated, pathname, push]);

  // Show nothing while checking authentication
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
