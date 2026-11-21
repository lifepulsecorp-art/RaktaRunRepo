import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from './context/AuthContext';
import { RaktaRunLogo } from './components/RaktaRunLogo';

function AppContent() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-white">
        <div className="startup-logo-glow"><RaktaRunLogo size="lg" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-rose-700 dark:text-rose-300">Every minute matters</p>
      </main>
    );
  }
  return <AppRoutes />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
