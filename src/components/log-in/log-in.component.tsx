'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { requestTokenAction, validateTokenAction } from '@/actions/auth/auth.action';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';

interface Step {
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    title: 'Request Token',
    description: 'Enter your email to receive a token',
  },
  {
    title: 'Validate Token',
    description: 'Enter the token received in your email',
  },
];

export const LogInComponent = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();

  const handleRequestToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await requestTokenAction({ email });

      if (result.success) {
        toast.success('Token sent successfully', {
          description: 'Please check your email for the token',
        });
        setCurrentStep(1);
      } else {
        toast.error('Error requesting token', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await validateTokenAction({ email, token });

      if (result.success) {
        toast.success('Login successful');
        router.push('/dashboard/nodal-modules/wellbore-design');
      } else {
        toast.error('Error validating token', {
          description: result.error.message,
        });
      }
    } catch (error) {
      toast.error('Error', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHasTokenChange = (checked: boolean) => {
    setHasToken(checked);
    if (checked) {
      setCurrentStep(1);
    } else {
      setCurrentStep(0);
      setToken(''); // Reset token when going back
    }
  };

  const handleBack = () => {
    setCurrentStep(0);
    setHasToken(false);
    setToken(''); // Reset token when going back
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg px-8 pb-10 pt-6">
        <div className="mb-8 w-full">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex flex-col items-center ${
                  index === currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    index === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  {index + 1}
                </div>
                <p className="mt-2 text-sm font-medium">{step.title}</p>
              </div>
            ))}
          </div>
          <div className="relative mt-4">
            <div className="absolute left-0 top-4 h-0.5 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-center text-3xl font-semibold">Log In</p>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {steps[currentStep].description}
          </p>
        </div>

        {currentStep === 0 ? (
          <form className="flex w-full flex-col gap-4" onSubmit={handleRequestToken}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                required
                name="email"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasToken"
                checked={hasToken}
                onCheckedChange={handleHasTokenChange}
              />
              <label
                htmlFor="hasToken"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I already have a token
              </label>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Token'}
            </Button>
          </form>
        ) : (
          <form className="flex w-full flex-col gap-4" onSubmit={handleValidateToken}>
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                required
                name="token"
                placeholder="Enter your token"
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleBack}
            >
              Back
            </Button>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Validating...' : 'Validate Token'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};