'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';

const PUBLIC_ROUTES = ['/login', '/signup'];

export function AuthLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);

      // If no session and trying to access protected route → redirect to login
      if (!data.session && !isPublicRoute) {
        router.replace('/login');
      }

      // If has session and on login/signup page → redirect to dashboard
      if (data.session && isPublicRoute) {
        router.replace('/');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // If user just logged in and on public route → go to dashboard
      if (session && isPublicRoute) {
        router.replace('/');
      }
      
      // If user logged out and on protected route → go to login
      if (!session && !isPublicRoute) {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, isPublicRoute, router]);

  // Show loading only on initial load
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Public pages → no sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected pages → sidebar
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}