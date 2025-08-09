'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  requestTokenAction,
  validateTokenAction,
} from '@/actions/auth/auth.action';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { User } from 'lucide-react';

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

  const handleRequestToken = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
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
          description: `${
            (result.error as any).details?.errorDetail ?? ''
          } contact the system administrator for assistance mlozano@nodalenergygroup.com.`,
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

  const handleValidateToken = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const result = await validateTokenAction({ token });

      if (result.success) {
        toast.success('Login successful');
        router.push('/dashboard/nodal-modules/wellbore-design');
      } else {
        toast.error('Error validating token', {
          description: `${result.error.message}. Please try again with a different token or contact the system administrator for assistance.`,
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
      setToken('');
    }
  };

  const handleBack = () => {
    setCurrentStep(0);
    setHasToken(false);
    setToken('');
  };

  return (
    <div className="flex h-screen">
      <div className="w-5/12 flex items-center justify-center bg-white text-gray-900 p-28">
        <div className="w-full animated fadeInUp">
          <div className="flex items-center justify-center mb-10">
            <User size={48} className="text-[#144E73]" />
            <h1 className="font-bold text-4xl text-center ml-3 text-gray-900">
              Log In
            </h1>
          </div>

          <div className="mb-8 w-full">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`flex flex-col items-center ${
                    index === currentStep ? 'text-[#144E73]' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      index === currentStep
                        ? 'bg-[#144E73] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <p className="mt-2 text-sm font-medium">{step.title}</p>
                </div>
              ))}
            </div>
            <div className="relative mt-4">
              <div className="absolute left-0 top-4 h-0.5 w-full bg-gray-200">
                <div
                  className="h-full bg-[#144E73] transition-all duration-300"
                  style={{
                    width: `${(currentStep / (steps.length - 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-center text-sm text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>

          {currentStep === 0 ? (
            <form
              className="flex flex-col gap-4 w-full"
              onSubmit={handleRequestToken}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  required
                  name="email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="rounded-full px-4 py-2 border border-gray-300 focus:border-[#144E73] focus:ring-1 focus:ring-[#144E73] bg-white text-gray-900 transition-colors duration-300"
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
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700"
                >
                  I already have a token
                </label>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full font-bold bg-[#144E73] text-white py-2 hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending...' : 'Send Token'}
                </Button>
              </div>
            </form>
          ) : (
            <form
              className="flex flex-col gap-4 w-full"
              onSubmit={handleValidateToken}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="token" className="text-gray-700">
                  Token
                </Label>
                <Input
                  id="token"
                  required
                  name="token"
                  placeholder="Enter your token"
                  type="text"
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  className="rounded-full px-4 py-2 border border-gray-300 focus:border-[#144E73] focus:ring-1 focus:ring-[#144E73] bg-white text-gray-900 transition-colors duration-300"
                />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full w-full border-gray-300 text-white hover:bg-gray-50 hover:text-gray-700 transition-colors duration-300"
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-full font-bold bg-[#144E73] text-white py-2 hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Validating...' : 'Validate Token'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="w-7/12 bg-[#1B262C] flex items-center justify-center animated fadeInRight">
        <img
          src="/img/NodalLogoStacked.svg"
          alt="Nodal Logo"
          className="w-[500px]"
        />
      </div>
    </div>
  );
};
