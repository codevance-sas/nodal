import { Header } from '@/components/layout/header';
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar';
import { DashboardContent } from '@/components/layout/dashboard-content';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getUser } from '@/services/auth/auth.service';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user.success) {
    return <div>Error</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen  min-w-full bg-background">
        <Header
          email={user.data.email}
          role={user.data.role as 'admin' | 'user'}
        />
        <DashboardSidebar />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </SidebarProvider>
  );
}
