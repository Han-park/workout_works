'use client'

import { AuthProvider } from "@/contexts/AuthContext";
import { ViewedUserProvider } from "@/contexts/ViewedUserContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ViewedUserProvider>
        {children}
      </ViewedUserProvider>
    </AuthProvider>
  );
} 