import { useState, useEffect } from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentProjects from '@/components/dashboard/RecentProjects';
import { useDashboardData } from '@/hooks/useDashboardData';
import Footer from '@/components/Footer';
import PlatformTour from '@/components/PlatformTour';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { projects, stats, loading } = useDashboardData();
  const { profile, user } = useAuth();
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Iniciar tour automaticamente para novos usuários
    if (profile && !profile.has_completed_tour && !loading) {
      // Delay para garantir que os elementos estejam renderizados
      setTimeout(() => {
        setRunTour(true);
      }, 1000);
    }
  }, [profile, loading]);

  useEffect(() => {
    // Escutar evento customizado para reiniciar tour
    const handleStartTour = () => {
      setRunTour(true);
    };

    window.addEventListener('startPlatformTour', handleStartTour);

    return () => {
      window.removeEventListener('startPlatformTour', handleStartTour);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20">
      <PlatformTour run={runTour} onClose={() => setRunTour(false)} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">
            Bem-vindo ao Dashboard
          </h1>
          <p className="text-raiz-secondary">
            Gerencie seus projetos e acompanhe seu progresso
          </p>
        </div>

        {/* Stats Cards */}
        <div data-tour="stats">
          <DashboardStats stats={stats} />
        </div>

        {/* Quick Actions */}
        <div data-tour="quick-actions">
          <QuickActions />
        </div>

        {/* Recent Projects */}
        <div data-tour="recent-projects">
          <RecentProjects projects={projects} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
