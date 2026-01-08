import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, AlertTriangle, Shield, Database, HardDrive, FileText, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';

interface BackupLog {
  id: string;
  created_at: string;
  action: string;
  details: {
    tables_count?: number;
    records_count?: number;
    storage_files?: number;
    storage_size_bytes?: number;
    errors?: Array<{ table: string; error: string }>;
    include_storage?: boolean;
  };
}

const BackupSettings = () => {
  const { user } = useAuth();
  const [isMasterAdmin, setIsMasterAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeStorage, setIncludeStorage] = useState(true);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  
  // Restore state
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    checkMasterAdmin();
    fetchBackupLogs();
  }, [user]);

  const checkMasterAdmin = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('admin_type')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!error && data?.admin_type === 'master') {
        setIsMasterAdmin(true);
      }
    } catch (err) {
      console.error('Erro ao verificar permissões:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackupLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_logs')
        .select('id, created_at, action, details')
        .eq('action', 'backup_generated')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setBackupLogs(data as BackupLog[]);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    }
  };

  const handleGenerateBackup = async () => {
    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Iniciando backup...');

    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);

      setProgressMessage('Conectando ao servidor...');

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Sessão não encontrada');
      }

      setProgressMessage('Exportando dados do banco...');
      setProgress(20);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'https://oefkzjyqjjfzfrmovfdt.supabase.co'}/functions/v1/generate-backup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ includeStorage })
        }
      );

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar backup');
      }

      setProgressMessage('Baixando arquivo...');
      setProgress(95);

      // Baixar o arquivo ZIP
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raiztoken-backup-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      setProgressMessage('Backup concluído com sucesso!');
      
      toast.success('Backup gerado e baixado com sucesso!');
      
      // Atualizar logs
      await fetchBackupLogs();
      
    } catch (error: any) {
      console.error('Erro ao gerar backup:', error);
      toast.error(error.message || 'Erro ao gerar backup');
      setProgressMessage('Erro ao gerar backup');
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setProgress(0);
        setProgressMessage('');
      }, 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast.error('Por favor, selecione um arquivo .zip de backup');
        return;
      }
      setRestoreFile(file);
      setShowRestoreDialog(true);
    }
  };

  const handleRestore = async () => {
    if (!restorePassword || restorePassword.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    setIsRestoring(true);
    try {
      // Por segurança, restauração requer implementação manual
      toast.warning(
        'A restauração de backup requer acesso direto ao banco de dados. ' +
        'Entre em contato com o suporte técnico para realizar esta operação.'
      );
      
      setShowRestoreDialog(false);
      setRestoreFile(null);
      setRestorePassword('');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar restauração');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isMasterAdmin) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground">
            Apenas administradores master podem acessar o sistema de backup.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Card Principal - Gerar Backup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Sistema de Backup Completo</CardTitle>
            </div>
            <CardDescription>
              Exporte todos os dados críticos da plataforma em um arquivo compactado e seguro
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações do Backup */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Database className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Banco de Dados</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todas as tabelas críticas: usuários, projetos, transações, ledger financeiro, tokens
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <HardDrive className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Storage</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Comprovantes de reembolso, arquivos de projetos, anexos de suporte
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <FileText className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">Manifesto</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Arquivo de controle com metadados para validação e restauração
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Opções de Backup */}
            <div className="space-y-4">
              <h4 className="font-medium">Opções de Backup</h4>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="include-storage" 
                  checked={includeStorage}
                  onCheckedChange={(checked) => setIncludeStorage(checked as boolean)}
                  disabled={isGenerating}
                />
                <Label htmlFor="include-storage" className="text-sm cursor-pointer">
                  Incluir arquivos do Storage (comprovantes, imagens, anexos)
                </Label>
              </div>
            </div>

            {/* Progresso */}
            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{progressMessage}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {/* Botão de Gerar */}
            <Button 
              onClick={handleGenerateBackup} 
              disabled={isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Gerar Backup Completo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Histórico de Backups */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Histórico de Backups</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {backupLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum backup gerado ainda
              </p>
            ) : (
              <div className="space-y-3">
                {backupLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium">{formatDate(log.created_at)}</p>
                        <p className="text-xs text-muted-foreground">
                          {log.details?.tables_count || 0} tabelas · {log.details?.records_count?.toLocaleString() || 0} registros
                          {log.details?.include_storage && ` · ${log.details?.storage_files || 0} arquivos`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.details?.errors && log.details.errors.length > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {log.details.errors.length} erros
                        </Badge>
                      )}
                      {log.details?.storage_size_bytes && (
                        <Badge variant="secondary" className="text-xs">
                          {formatBytes(log.details.storage_size_bytes)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restaurar Backup */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle className="text-lg">Restaurar Backup</CardTitle>
            </div>
            <CardDescription>
              ⚠️ ATENÇÃO: A restauração substitui todos os dados atuais. Use apenas em caso de emergência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Esta operação NÃO pode ser desfeita</li>
                <li>• Todos os dados atuais serão substituídos</li>
                <li>• Requer acesso técnico ao banco de dados</li>
                <li>• Contate o suporte antes de prosseguir</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backup-file">Arquivo de Backup (.zip)</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Restauração */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Restauração
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Você está prestes a restaurar o backup: <strong>{restoreFile?.name}</strong>
              </p>
              <p className="font-semibold text-destructive">
                Esta operação irá SUBSTITUIR TODOS OS DADOS ATUAIS!
              </p>
              <div className="mt-4 space-y-2">
                <Label htmlFor="restore-password">Digite a senha de segurança para confirmar</Label>
                <Input
                  id="restore-password"
                  type="password"
                  placeholder="Senha (mínimo 8 caracteres)"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                  minLength={8}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRestorePassword('');
              setRestoreFile(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring || restorePassword.length < 8}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Restaurar Backup'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BackupSettings;
