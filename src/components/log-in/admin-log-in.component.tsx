'use client';

import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/actions/auth/auth.action';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ActionResult,
  ActionError,
} from '@/core/common/types/action.types';
import type { LoginResponse } from '@/core/common/types/auth.types';

export const AdminLogInComponent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      const result = (await loginAction({
        email,
        password,
      })) as any;

      console.log('[result]', result);

      if (result?.data?.success) {
        toast.success('Successful login.');
        router.push('/dashboard/nodal-modules/wellbore-design');
        return;
      }

      if (result) {
        toast.error('Login error', {
          description: result?.data?.message ?? 'Invalid email or password',
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'Ocurrió un error inesperado',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg px-8 pb-10 pt-6">
        <p className="pb-4 text-center text-3xl font-semibold">Log In</p>
        <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              required
              name="email"
              placeholder="Enter your email"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                required
                name="password"
                placeholder="Enter your password"
                type={isVisible ? 'text' : 'password'}
              />
              <button
                type="button"
                onClick={toggleVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {isVisible ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </Button>
        </form>
      </div>
    </div>
  );
};
