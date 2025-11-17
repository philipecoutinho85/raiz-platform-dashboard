import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { ReportCommunicationModal } from './ReportCommunicationModal';

interface Report {
  id: string;
  project_id: string;
  reason: string;
  reported_by: string;
  status: string;
  created_at: string;
  projects?: {
    title: string;
    user_id: string;
  };
}

export const ReportsManagement = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_reports')
        .select(`
          *,
          projects (
            title,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCommunication = (report: Report) => {
    setSelectedReport(report);
    setShowCommunicationModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolvida</Badge>;
      case 'rejected':
        return <Badge variant="outline">Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Denúncias de Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma denúncia registrada
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-destructive">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {report.projects?.title || 'Projeto'}
                          </h4>
                          {getStatusBadge(report.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Motivo:</strong> {report.reason}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Denunciado em:{' '}
                          {new Date(report.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleOpenCommunication(report)}
                        size="sm"
                        variant="outline"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comunicar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReportCommunicationModal
        isOpen={showCommunicationModal}
        onClose={() => {
          setShowCommunicationModal(false);
          setSelectedReport(null);
        }}
        report={selectedReport}
        onUpdate={fetchReports}
      />
    </>
  );
};
