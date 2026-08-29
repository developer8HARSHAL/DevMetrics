'use client'

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, FileText, AlertCircle, Activity, Key, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState } from 'react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/metrics', label: 'Metrics', icon: BarChart3 },
    { href: '/logs', label: 'Logs', icon: FileText },
    { href: '/errors', label: 'Errors', icon: AlertCircle },
    { href: '/api-key', label: 'API Key', icon: Key },
  ];

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      if (supabase) {
        await supabase.auth.signOut();
      }
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  return (
    <aside
      className="w-64 min-h-screen flex flex-col p-6 border-r"
      style={{ background: 'var(--surface-sidebar)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="mb-10 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand)' }}
        >
          <Activity className="text-white" size={18} strokeWidth={2} />
        </div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ink-strong)' }}>
          DevMetrics
        </h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left text-sm"
              style={
                isActive
                  ? {
                      background: 'var(--brand-light)',
                      color: 'var(--brand-text)',
                      fontWeight: 600,
                    }
                  : { color: 'var(--ink-muted)', fontWeight: 500 }
              }
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.25 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-medium transition-colors disabled:opacity-50 mt-4"
          style={{ color: 'var(--color-danger)' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-danger-bg)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={18} />
          <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}