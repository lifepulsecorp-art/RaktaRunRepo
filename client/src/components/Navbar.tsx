import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND_TAGLINE } from '../constants/brand';
import { RaktaRunLogo } from './RaktaRunLogo';
import { ThemeToggle } from './ui/ThemeToggle';
import {
  Menu,
  X,
  LogOut,
  PlusCircle,
  Award,
  ChevronRight,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  showSidebarToggle = false,
  sidebarOpen = false,
}) => {
  const { profile, role, roleData, logout, firebaseUser } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = Boolean(firebaseUser && role);

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    if (role === 'hospital') return '/hospital';
    return '/donor';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
        {/* Left Section: Brand & Sidebar Toggle */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {showSidebarToggle && (
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-expanded={sidebarOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle navigation sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <RaktaRunLogo size="nav" />
          <p className={`${showSidebarToggle ? 'w-16' : 'w-20'} min-w-0 text-[10px] font-extrabold leading-tight tracking-wide text-slate-900 dark:text-white max-[359px]:hidden min-[400px]:w-28 sm:w-auto sm:max-w-56 sm:text-xs md:text-sm`}>
            {BRAND_TAGLINE}
          </p>

          {/* Regional network pill indicator */}
          <div className="hidden 2xl:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Trauma Grid Live (Udupi & Mangaluru)</span>
          </div>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-1 text-xs lg:text-sm font-semibold">
          {!isAuthenticated ? (
            <>
              <Link
                to="/"
                className={`px-3 py-2 rounded-xl transition ${
                  isActive('/')
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                Home
              </Link>
              <Link
                to="/hero-wall"
                className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                  isActive('/hero-wall')
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <Award className="h-4 w-4 text-amber-500" />
                <span>Community Heroes</span>
              </Link>
            </>
          ) : (
            <>
              {role === 'donor' && (
                <>
                  <Link
                    to="/donor"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/donor')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Hero Portal
                  </Link>
                  <Link
                    to="/donor/hero-card"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/donor/hero-card')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Hero Card Studio
                  </Link>
                  <Link
                    to="/hero-wall"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/hero-wall')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Leaderboard
                  </Link>
                </>
              )}

              {role === 'hospital' && (
                <>
                  <Link
                    to="/hospital"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/hospital')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Blood Bank Hub
                  </Link>
                  <Link
                    to="/hospital/request/new"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-rose-950/20 transition active:scale-95"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Emergency Requisition</span>
                  </Link>
                  <Link
                    to="/hospital/profile"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/hospital/profile')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Facility Settings
                  </Link>
                </>
              )}

              {role === 'admin' && (
                <>
                  <Link
                    to="/admin"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/admin')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    System Control
                  </Link>
                  <Link
                    to="/admin/hospitals"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/admin/hospitals')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Hospitals
                  </Link>
                  <Link
                    to="/admin/donors"
                    className={`px-3 py-2 rounded-xl transition ${
                      isActive('/admin/donors')
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Donors
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right Section: Theme Toggle & Profile / Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {roleData?.fullName || roleData?.name || profile?.name || 'Authorized User'}
                </span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 capitalize">
                  {role === 'donor'
                    ? `Hero (${roleData?.bloodGroup || 'Donor'})`
                    : role === 'hospital'
                    ? 'Blood Bank Officer'
                    : 'System Admin'}
                </span>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Sign out of RaktaRun"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 active:scale-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-rose-900/50 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white transition active:scale-95 sm:inline-flex"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="hidden rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-rose-950/20 hover:from-rose-500 hover:to-rose-600 transition active:scale-95 sm:inline-flex"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu button */}
          {(!showSidebarToggle || !isAuthenticated) && (
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 xl:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 space-y-3 animate-in fade-in slide-in-from-top-2">
          {!isAuthenticated ? (
            <>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <span>Home</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              <Link
                to="/hero-wall"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" /> Community Hero Wall
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              <div className="pt-2 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-800 dark:border-slate-800 dark:text-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl bg-rose-600 py-2.5 text-center text-xs font-bold text-white shadow"
                >
                  Join Network
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {roleData?.fullName || roleData?.name || profile?.name}
                </p>
                <p className="text-[11px] text-rose-500 font-semibold uppercase">{role}</p>
              </div>
              <Link
                to={getDashboardLink()}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <span>Dashboard Overview</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              {role === 'donor' && (
                <Link
                  to="/donor/hero-card"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl p-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <span>Hero Card Studio</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              )}
              {role === 'hospital' && (
                <Link
                  to="/hospital/request/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-rose-600/10 p-2.5 text-sm font-bold text-rose-600 dark:text-rose-400"
                >
                  <span>+ Emergency Requisition</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/hero-wall"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl p-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                <span>Community Hero Wall</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left flex items-center gap-2 rounded-xl p-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
