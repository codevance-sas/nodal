'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Calendar,
  Mail,
  Shield,
  User,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  getAllTokensAction,
  generateTokenAction,
} from '@/actions/auth/auth.action';
import type { Token } from '@/core/common/types/auth.types';

const ITEMS_PER_PAGE = 10;

export const TokenManagementPanel = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    is_admin: false,
  });

  useEffect(() => {
    loadTokens();
  }, [currentPage]);

  const loadTokens = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const result = await getAllTokensAction(skip, ITEMS_PER_PAGE);

      if (result.success) {
        setTokens(result.data.tokens);
        setTotalTokens(result.data.total);
      } else {
        toast.error('Error loading tokens', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateToken = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const result = await generateTokenAction(formData);

      if (result.success) {
        toast.success('Token generated successfully', {
          description: `Token created for ${result.data.email}`,
        });
        setIsGenerateDialogOpen(false);
        setFormData({ email: '', is_admin: false });
        loadTokens();
      } else {
        toast.error('Error generating token', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshToken = async (
    email: string,
    isAdminGenerated: boolean
  ) => {
    setRefreshingToken(email);

    try {
      const result = await generateTokenAction({
        email,
        is_admin: isAdminGenerated,
      });

      if (result.success) {
        toast.success('Token refreshed successfully', {
          description: `New token created for ${email}`,
        });
        loadTokens();
      } else {
        toast.error('Error refreshing token', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setRefreshingToken(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const totalPages = Math.ceil(totalTokens / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Token Management
          </h2>
          <p className="text-muted-foreground">
            Manage authentication tokens for users
          </p>
        </div>
        <Dialog
          open={isGenerateDialogOpen}
          onOpenChange={setIsGenerateDialogOpen}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Generate New Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Token</DialogTitle>
              <DialogDescription>
                Create a new authentication token for a user.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerateToken} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter user email"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_admin"
                  checked={formData.is_admin}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, is_admin: checked }))
                  }
                />
                <Label htmlFor="is_admin">Admin Token</Label>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsGenerateDialogOpen(false)}
                  disabled={isGenerating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate Token'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created At
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expires At
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading tokens...
                </TableCell>
              </TableRow>
            ) : tokens.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No tokens found
                </TableCell>
              </TableRow>
            ) : (
              tokens.map(token => (
                <TableRow key={`${token.email}-${token.created_at}`}>
                  <TableCell className="font-medium">{token.email}</TableCell>
                  <TableCell>{formatDate(token.created_at)}</TableCell>
                  <TableCell>{formatDate(token.expires_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          token.is_used
                            ? 'secondary'
                            : isTokenExpired(token.expires_at)
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {token.is_used ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Used
                          </>
                        ) : isTokenExpired(token.expires_at) ? (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Expired
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        )}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        token.is_admin_generated ? 'default' : 'secondary'
                      }
                    >
                      {token.is_admin_generated ? (
                        <>
                          <Shield className="mr-1 h-3 w-3" />
                          Admin
                        </>
                      ) : (
                        <>
                          <User className="mr-1 h-3 w-3" />
                          User
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleRefreshToken(
                          token.email,
                          token.is_admin_generated
                        )
                      }
                      disabled={refreshingToken === token.email}
                    >
                      {refreshingToken === token.email ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Refresh
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {tokens.length} of {totalTokens} tokens
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
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
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
    </div>
  );
};
