'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MoreVertical,
  Search,
  UserCog,
  UserMinus,
  UserPlus,
  Shield,
  User,
} from 'lucide-react';
import { EditUserForm } from './edit-user-form.component';
import type { User as UserType } from '@/core/common/types/auth.types';
import {
  getUsersAction,
  updateUserAction,
  activateUserAction,
  deactivateUserAction,
  setUserRoleAction,
} from '@/actions/users/users.action';

const ITEMS_PER_PAGE = 10;

export function UserManagementPanel() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'activate' | 'deactivate' | 'role';
    payload?: any;
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const result = await getUsersAction(skip, ITEMS_PER_PAGE);

      if (result.success) {
        setUsers(result.data.users);
        setTotalUsers(result.data.total);
      } else {
        toast.error('Error loading users', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async (userData: UserType) => {
    try {
      const result = await updateUserAction(Number(userData.id), userData);

      if (result.success) {
        toast.success('User updated successfully');
        setIsEditDialogOpen(false);
        loadUsers();
      } else {
        toast.error('Error updating user', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    }
  };

  const handleActivateDeactivate = async (
    userId: number,
    activate: boolean
  ) => {
    try {
      const result = activate
        ? await activateUserAction(userId)
        : await deactivateUserAction(userId);

      if (result.success) {
        toast.success(
          `User ${activate ? 'activated' : 'deactivated'} successfully`
        );
        loadUsers();
      } else {
        toast.error('Error updating user status', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    }
  };

  const handleRoleChange = async (
    userId: number,
    newRole: 'user' | 'admin'
  ) => {
    try {
      const result = await setUserRoleAction(userId, newRole);

      if (result.success) {
        toast.success('User role updated successfully');
        loadUsers();
      } else {
        toast.error('Error updating user role', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    }
  };

  const totalPages = Math.ceil(totalUsers / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.email}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                    >
                      {user.role === 'admin' ? (
                        <Shield className="mr-1 h-3 w-3" />
                      ) : (
                        <User className="mr-1 h-3 w-3" />
                      )}
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'destructive'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setPendingAction({
                              type: user.is_active ? 'deactivate' : 'activate',
                            });
                            setIsConfirmDialogOpen(true);
                          }}
                        >
                          {user.is_active ? (
                            <>
                              <UserMinus className="mr-2 h-4 w-4" />
                              Deactivate User
                            </>
                          ) : (
                            <>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Activate User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setPendingAction({
                              type: 'role',
                              payload: user.role === 'admin' ? 'user' : 'admin',
                            });
                            setIsConfirmDialogOpen(true);
                          }}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Make {user.role === 'admin' ? 'User' : 'Admin'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {users.length} of {totalUsers} users
        </p>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage(prev => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              user={selectedUser}
              onSubmit={handleEditUser}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === 'activate'
                ? 'This will activate the user account.'
                : pendingAction?.type === 'deactivate'
                ? 'This will deactivate the user account.'
                : `This will change the user's role to ${pendingAction?.payload}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser && pendingAction) {
                  if (pendingAction.type === 'activate') {
                    handleActivateDeactivate(Number(selectedUser.id), true);
                  } else if (pendingAction.type === 'deactivate') {
                    handleActivateDeactivate(Number(selectedUser.id), false);
                  } else if (pendingAction.type === 'role') {
                    handleRoleChange(
                      Number(selectedUser.id),
                      pendingAction.payload
                    );
                  }
                }
                setIsConfirmDialogOpen(false);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
