
import DashboardStats from '@/components/dashboard/DashboardStats';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentProjects from '@/components/dashboard/RecentProjects';
import { useDashboardData } from '@/hooks/useDashboardData';
import Footer from '@/components/Footer';

const Dashboard = () => {
  const { projects, stats, loading } = useDashboardData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-raiz-light to-raiz-accent/20">
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
        <DashboardStats stats={stats} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Recent Projects */}
        <RecentProjects projects={projects} />
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
