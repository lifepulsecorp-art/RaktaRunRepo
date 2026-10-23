import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  BellRing,
  PlusCircle,
  Building2,
  Users,
  Shield,
  LogOut,
  Activity,
  Sparkles,
  Flag,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  className = '',
}) => {
  const { role, roleData, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Donor Navigation Links
  const donorNav: NavItem[] = [
    { label: 'Emergency Dashboard', path: '/donor', icon: BellRing, badge: 'Live' },
    { label: 'Hero Card Studio', path: '/donor/hero-card', icon: Award, badge: 'Badges' },
    { label: 'Community Hero Wall', path: '/hero-wall', icon: Sparkles },
  ];

  // Hospital Navigation Links
  const hospitalNav: NavItem[] = [
    { label: 'Blood Bank Hub', path: '/hospital', icon: Activity, badge: 'Active' },
    { label: 'New Emergency Requisition', path: '/hospital/request/new', icon: PlusCircle, highlight: true },
    { label: 'Hospital Profile', path: '/hospital/profile', icon: Building2 },
    { label: 'Community Heroes', path: '/hero-wall', icon: Award },
  ];

  // Admin Navigation Links
  const adminNav: NavItem[] = [
    { label: 'System Overview', path: '/admin', icon: Shield, badge: 'Admin' },
    { label: 'Hospital Verifications', path: '/admin/hospitals', icon: Building2 },
    { label: 'Verified Donors', path: '/admin/donors', icon: Users },
    { label: 'Buddy Reports', path: '/admin/buddy-reports', icon: Flag },
    { label: 'Community Hero Wall', path: '/hero-wall', icon: Award },
  ];

  const currentNav = role === 'admin' ? adminNav : role === 'hospital' ? hospitalNav : donorNav;

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 shrink-0 overflow-y-auto border-r border-slate-200/80 bg-white p-4 pt-20 transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-950 lg:sticky lg:top-16 lg:bottom-auto lg:h-[calc(100vh-4rem)] lg:bg-white/95 lg:pt-4 lg:backdrop-blur-xl lg:dark:bg-slate-950/95 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
      >
        <div className="flex min-h-full flex-col justify-between gap-6">
          <div>
            {/* Context Header */}
            <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                {role === 'donor'
                  ? 'Responder Portal'
                  : role === 'hospital'
                  ? 'Hospital Blood Bank'
                  : 'System Administration'}
              </span>
              <p className="mt-0.5 truncate text-xs font-bold text-slate-900 dark:text-white">
                {roleData?.fullName || roleData?.name || 'Verified Session'}
              </p>
              {role === 'donor' && roleData?.bloodGroup && (
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Group {roleData.bloodGroup} • Verified</span>
                </div>
              )}
            </div>

            {/* Navigation Item List */}
            <nav className="space-y-1">
              {currentNav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      item.highlight
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-950/20 hover:bg-rose-500'
                        : active
                        ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 font-bold border border-rose-500/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 ${item.highlight ? 'text-white' : active ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                      <span>{item.label}</span>
                    </span>
                    {item.badge && !item.highlight && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Session Box */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>Network Region</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">KA-UD / DK</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span>Transit Tracking</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">GPS Active</span>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
