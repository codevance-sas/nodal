import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function UserManagementLoading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search and filters skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-[300px]" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-10 w-[120px]" />
                <Skeleton className="h-10 w-[120px]" />
              </div>
            </div>

            {/* Table skeleton */}
            <div className="rounded-md border">
              <div className="border-b">
                <div className="flex h-12 items-center px-4">
                  <div className="flex flex-1 items-center space-x-8">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                    <div className="flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
              
              {/* Table rows skeleton */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border-b last:border-b-0">
                  <div className="flex h-16 items-center px-4">
                    <div className="flex flex-1 items-center space-x-8">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                      <div className="flex-1" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}