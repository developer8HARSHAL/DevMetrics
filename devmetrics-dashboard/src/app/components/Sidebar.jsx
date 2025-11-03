'use client'

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, BarChart3, FileText, AlertCircle, Activity } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/metrics', label: 'Metrics', icon: BarChart3 },
    { href: '/logs', label: 'Logs', icon: FileText },
    { href: '/errors', label: 'Errors', icon: AlertCircle },
  ];

  return (
    <aside className="w-64 bg-gray-50 min-h-screen flex flex-col p-6">
      {/* Logo */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <Activity className="text-white" size={20} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">DevMetrics</h1>
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className={`${isActive ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6">
        <div className="text-xs text-gray-500">
          <p>Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
}