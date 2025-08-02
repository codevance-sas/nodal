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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Calendar,
  Globe,
  Trash2,
  MoreVertical,
  Edit,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import {
  getAllowedDomainsAction,
  addAllowedDomainAction,
  removeAllowedDomainAction,
} from '@/actions/auth/auth.action';
import type { AllowedDomain } from '@/core/common/types/auth.types';

const ITEMS_PER_PAGE = 10;

export const DomainManagementPanel = () => {
  const [domains, setDomains] = useState<AllowedDomain[]>([]);
  const [totalDomains, setTotalDomains] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    domain: '',
    description: '',
  });

  useEffect(() => {
    loadDomains();
  }, [currentPage]);

  const loadDomains = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const result = await getAllowedDomainsAction(skip, ITEMS_PER_PAGE);

      if (result.success) {
        setDomains(result.data.domains);
        setTotalDomains(result.data.total);
      } else {
        toast.error('Error loading domains', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const result = await addAllowedDomainAction(formData);

      if (result.success) {
        toast.success('Domain added successfully', {
          description: `Domain ${result.data.domain} has been added`,
        });
        setIsAddDialogOpen(false);
        setFormData({ domain: '', description: '' });
        loadDomains();
      } else {
        toast.error('Error adding domain', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveDomain = async (domain: string) => {
    try {
      const result = await removeAllowedDomainAction(domain);

      if (result.success) {
        toast.success('Domain removed successfully', {
          description: `Domain ${domain} has been removed`,
        });
        loadDomains();
      } else {
        toast.error('Error removing domain', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Unexpected error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const validateDomain = (domain: string) => {
    const domainRegex =
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  };

  const totalPages = Math.ceil(totalDomains / ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Domain Management
          </h2>
          <p className="text-muted-foreground">
            Manage allowed domains for user registration
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Domain
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Domain</DialogTitle>
              <DialogDescription>
                Add a new domain to the allowed list for user registration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  type="text"
                  value={formData.domain}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, domain: e.target.value }))
                  }
                  placeholder="example.com"
                  required
                />
                {formData.domain && !validateDomain(formData.domain) && (
                  <p className="text-sm text-destructive">
                    Please enter a valid domain format
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter domain description"
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isAdding ||
                    !validateDomain(formData.domain) ||
                    !formData.description.trim()
                  }
                >
                  {isAdding ? 'Adding...' : 'Add Domain'}
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
                  <Globe className="h-4 w-4" />
                  Domain
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created At
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading domains...
                </TableCell>
              </TableRow>
            ) : domains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No domains found
                </TableCell>
              </TableRow>
            ) : (
              domains.map(domain => (
                <TableRow key={domain.domain}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      {domain.domain}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {domain.description}
                  </TableCell>
                  <TableCell>{formatDate(domain.created_at)}</TableCell>
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
                            setSelectedDomain(domain.domain);
                            setIsConfirmDialogOpen(true);
                          }}
                          className="hover:bg-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Domain
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
          Showing {domains.length} of {totalDomains} domains
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

      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the domain "{selectedDomain}" from the allowed
              list. Users with this domain will no longer be able to register.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedDomain) {
                  handleRemoveDomain(selectedDomain);
                }
                setIsConfirmDialogOpen(false);
              }}
            >
              Remove Domain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
