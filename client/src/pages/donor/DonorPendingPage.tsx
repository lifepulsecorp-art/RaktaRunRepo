import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RaktaRunLogo } from '../../components/RaktaRunLogo';
import { Clock } from 'lucide-react';

export default function DonorPendingPage() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between items-center p-6 relative transition-colors duration-200">
      <div className="w-full max-w-md flex items-center justify-between">
        <RaktaRunLogo size="sm" />
        <ThemeToggle />
      </div>

      <Card className="max-w-md w-full text-center p-8 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 mb-5">
          <Clock className="h-8 w-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Verification In Progress</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
          Your hospital certificate has been received. A RaktaRun administrator will review it shortly.
          Once approved, your emergency alert network status will be activated.
        </p>
        <Button
          variant="outline"
          onClick={logout}
          className="w-full"
        >
          Sign Out
        </Button>
      </Card>

      <div className="text-xs text-slate-500 text-center">
        RaktaRun Emergency Verification Desk
      </div>
    </div>
  );
}

