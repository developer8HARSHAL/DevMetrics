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
    // If Supabase is not configured, skip auth and allow access
    if (!supabase) {
      setLoading(false);
      return;
    }

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
    }).catch((error) => {
      console.error('Auth error:', error);
      setLoading(false);
    });

    // Listen for auth changes
    let subscription = null;
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
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
      subscription = sub;
    } catch (error) {
      console.error('Auth state change error:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [pathname, isPublicRoute, router]);

  // Show loading only on initial load
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--surface-page)' }}
      >
        <div
          className="w-6 h-6 rounded-full animate-spin"
          style={{ border: '3px solid var(--border)', borderTopColor: 'var(--brand)' }}
        />
      </div>
    );
  }

  // Public pages → no sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected pages → sidebar
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--surface-page)' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}