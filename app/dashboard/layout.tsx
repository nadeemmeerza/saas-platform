import { redirect } from 'next/navigation';
import { getAuthToken } from '@/lib/auth';
import Navigation from '@/components/Navigation';


export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthToken();
  if (!token) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}