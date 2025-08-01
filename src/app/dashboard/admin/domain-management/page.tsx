import { DomainManagementPanel } from '@/components/admin/domain-management/domain-management-panel.component';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUser } from '@/services/auth/auth.service';

export default async function DomainManagementPage() {
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

  return <DomainManagementPanel />;
}
