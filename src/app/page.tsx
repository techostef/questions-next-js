'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/Button';
import Input from '@/components/Input';

// Wrapper component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}

// Client component that uses searchParams
function LoginContent() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const path = searchParams.get('path')
      if (path) {
        router.push(path);
      } else {
        router.push('/quiz');
      }
    }
  }, [isAuthenticated, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(username, password);
    if (success) {
      router.push('/quiz');
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            English Quiz App
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the quiz
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md -space-y-px">
            <div className='mb-2'>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
            >
              Sign in
            </Button>
          </div>
          <div className="text-sm text-center">
            <p className="text-gray-500">
              For demo purposes, enter any username and password
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
