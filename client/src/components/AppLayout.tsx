import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  withSidebar?: boolean;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  containerClassName?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  withSidebar,
  title,
  subtitle,
  badge,
  actions,
  containerClassName = '',
}) => {
  const { firebaseUser, role } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Automatically enable sidebar for authenticated portal pages unless explicitly set to false
  const showSidebar = withSidebar !== undefined ? withSidebar : Boolean(firebaseUser && role);

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-gradient-to-br from-slate-50 via-amber-50/60 to-rose-50/40 text-slate-900 transition-colors duration-200 dark:bg-none dark:bg-slate-950 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        showSidebarToggle={showSidebar}
        sidebarOpen={mobileSidebarOpen}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex min-h-0 w-full min-w-0 flex-1">
        {/* Responsive Collapsible Sidebar */}
        {showSidebar && (
          <Sidebar
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {(title || actions) && (
            <div className="border-b border-slate-200/80 bg-white/50 px-3 py-3 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/30 sm:px-6 sm:py-5 lg:px-8">
              <div className="mx-auto flex min-w-0 max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    {title && (
                      <h1 className="min-w-0 break-words text-xl font-black tracking-tight text-slate-900 dark:text-white font-display sm:text-2xl">
                        {title}
                      </h1>
                    )}
                    {badge}
                  </div>
                  {subtitle && (
                    <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div>}
              </div>
            </div>
          )}

          <main className={`w-full min-w-0 flex-1 px-3 py-3 sm:p-6 lg:p-8 ${containerClassName}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
