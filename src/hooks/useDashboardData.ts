
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised_amount: number;
  backers_count: number;
  status: string;
  created_at: string;
  deadline?: string;
}

interface DashboardStats {
  totalProjects: number;
  pendingProjects: number;
  approvedProjects: number;
  totalRaised: number;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    pendingProjects: 0,
    approvedProjects: 0,
    totalRaised: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchUserProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar projetos.",
          variant: "destructive"
        });
        return;
      }

      setProjects(projects || []);

      // Calculate stats - only raised_amount from approved projects
      const totalProjects = projects?.length || 0;
      const pendingProjects = projects?.filter(p => p.status === 'pending').length || 0;
      const approvedProjects = projects?.filter(p => p.status === 'approved').length || 0;
      const totalRaised = projects?.filter(p => p.status === 'approved').reduce((sum, p) => sum + (p.raised_amount || 0), 0) || 0;

      setStats({
        totalProjects,
        pendingProjects,
        approvedProjects,
        totalRaised
      });

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProjects();
  }, [user]);

  return {
    projects,
    stats,
    loading,
    refetch: fetchUserProjects
  };
};
