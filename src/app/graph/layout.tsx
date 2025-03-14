import { ViewedUserProvider } from '@/contexts/ViewedUserContext';

export default function GraphLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ViewedUserProvider>
      {children}
    </ViewedUserProvider>
  );
} 