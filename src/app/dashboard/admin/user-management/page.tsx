import { getUser } from '@/services/auth/auth.service';
import { UserManagementPanel } from '@/components/admin/user-management/user-management-panel.component';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function UserManagementPage() {
  const user = await getUser();
  if (!user.success) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              {user.error.error.detail[0]?.msg || 'An error occurred'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.data.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You are not authorized to access this page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts, roles, and permissions
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <UserManagementPanel />
        </CardContent>
      </Card>
    </div>
  );
}
