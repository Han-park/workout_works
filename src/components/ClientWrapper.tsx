'use client'

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ViewedUserProvider } from '@/contexts/ViewedUserContext';
import { monitorFetch } from '@/utils/networkDebug';
import ClientRoot from '@/components/ClientRoot';

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Only run in browser
    if (typeof window !== 'undefined') {
      monitorFetch();
    }
  }, []);

  return (
    <AuthProvider>
      <ViewedUserProvider>
        <ClientRoot>
          {children}
        </ClientRoot>
      </ViewedUserProvider>
    </AuthProvider>
  );
} 